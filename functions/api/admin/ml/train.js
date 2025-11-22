/**
 * Cloudflare Pages Function for /api/admin/ml/train
 * Trains a simple multi-class logistic regression (single-layer NN) model
 * on a dataset stored in Workers KV and returns basic metrics.
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: 'KV not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    let email = tokenValue;
    if (tokenValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === 'string') {
          email = parsed.email;
        }
      } catch {
        // fall back to raw tokenValue
      }
    }

    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const {
      datasetKey,
      datasetKeys,
      targetColumn,
      featureColumns,
      algorithmId,
      hyperparams,
    } = body;

    let datasetKeysList = [];

    if (Array.isArray(datasetKeys) && datasetKeys.length > 0) {
      datasetKeysList = datasetKeys
        .map((k) => (typeof k === 'string' ? k.trim() : ''))
        .filter((k) => k);
    } else if (typeof datasetKey === 'string' && datasetKey.trim()) {
      datasetKeysList = [datasetKey.trim()];
    }

    if (datasetKeysList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'datasetKey or datasetKeys is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (!targetColumn || typeof targetColumn !== 'string') {
      return new Response(
        JSON.stringify({ error: 'targetColumn is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    if (!Array.isArray(featureColumns) || featureColumns.length === 0) {
      return new Response(
        JSON.stringify({ error: 'featureColumns must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Load all selected datasets and verify that each has the target & feature columns
    const datasetsMeta = [];

    for (const key of datasetKeysList) {
      const value = await env.SPORTS_KV.get(`dataset:${key}`);
      if (!value) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' not found` }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      let dataset;
      try {
        dataset = JSON.parse(value);
      } catch {
        return new Response(
          JSON.stringify({ error: `Malformed dataset in KV for key '${key}'` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const headers = Array.isArray(dataset.headers) ? dataset.headers : null;
      const rows = Array.isArray(dataset.rows) ? dataset.rows : null;

      if (!headers || !rows) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' is missing headers or rows` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const targetIndex = headers.indexOf(targetColumn);
      if (targetIndex === -1) {
        return new Response(
          JSON.stringify({ error: `Dataset '${key}' does not contain target column '${targetColumn}'` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      const missingFeatures = [];
      const featureIndices = featureColumns.map((col) => {
        const idx = headers.indexOf(col);
        if (idx === -1) {
          missingFeatures.push(col);
        }
        return idx;
      });

      if (missingFeatures.length > 0) {
        return new Response(
          JSON.stringify({
            error: `Dataset '${key}' is missing feature columns: ${missingFeatures.join(', ')}`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }

      datasetsMeta.push({ key, headers, rows, targetIndex, featureIndices });
    }

    const maxRows = (hyperparams && Number(hyperparams.maxRows)) || 1000;
    const learningRate = (hyperparams && Number(hyperparams.learningRate)) || 0.05;
    const epochs = Math.min((hyperparams && Number(hyperparams.epochs)) || 20, 50);

    // Build feature matrix X and label vector y from all datasets
    const X = [];
    const y = [];
    const labelToIndex = new Map();
    const indexToLabel = [];

    outerLoop: for (const meta of datasetsMeta) {
      const { rows, targetIndex, featureIndices } = meta;
      for (let i = 0; i < rows.length; i++) {
        if (X.length >= maxRows) break outerLoop;
        const row = rows[i];
        if (!Array.isArray(row)) continue;

        const labelRaw = row[targetIndex];
        if (labelRaw == null || labelRaw === '') continue;

        const features = featureIndices.map((idx) => {
          const raw = row[idx];
          const num = parseFloat(raw == null || raw === '' ? '0' : String(raw));
          return Number.isFinite(num) ? num : 0;
        });

        let labelIndex;
        if (labelToIndex.has(labelRaw)) {
          labelIndex = labelToIndex.get(labelRaw);
        } else {
          labelIndex = indexToLabel.length;
          labelToIndex.set(labelRaw, labelIndex);
          indexToLabel.push(labelRaw);
        }

        X.push(features);
        y.push(labelIndex);
      }
    }

    const numSamples = X.length;
    const numFeatures = featureColumns.length;
    const numClasses = indexToLabel.length;

    if (numSamples < 2 || numClasses < 2) {
      return new Response(
        JSON.stringify({
          error: 'Not enough data or classes to train a model (need at least 2 samples and 2 classes).',
          numSamples,
          numClasses,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    // Initialize weights for multi-class logistic regression (softmax)
    const W = [];
    const b = new Array(numClasses).fill(0);
    for (let k = 0; k < numClasses; k++) {
      const w = [];
      for (let j = 0; j < numFeatures; j++) {
        w.push((Math.random() - 0.5) * 0.01);
      }
      W.push(w);
    }

    const softmax = (logits) => {
      let maxLogit = -Infinity;
      for (let i = 0; i < logits.length; i++) {
        if (logits[i] > maxLogit) maxLogit = logits[i];
      }
      let sumExp = 0;
      const exps = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        const e = Math.exp(logits[i] - maxLogit);
        exps[i] = e;
        sumExp += e;
      }
      const probs = new Array(logits.length);
      for (let i = 0; i < logits.length; i++) {
        probs[i] = exps[i] / (sumExp || 1);
      }
      return probs;
    };

    // Training loop (stochastic gradient descent)
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < numSamples; i++) {
        const x = X[i];
        const labelIndex = y[i];

        // Compute logits
        const logits = new Array(numClasses).fill(0);
        for (let k = 0; k < numClasses; k++) {
          let z = b[k];
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            z += wk[j] * x[j];
          }
          logits[k] = z;
        }

        const probs = softmax(logits);

        // Gradient and update
        for (let k = 0; k < numClasses; k++) {
          const indicator = k === labelIndex ? 1 : 0;
          const gradLogit = probs[k] - indicator; // dL/dz
          const wk = W[k];
          for (let j = 0; j < numFeatures; j++) {
            wk[j] -= learningRate * gradLogit * x[j];
          }
          b[k] -= learningRate * gradLogit;
        }
      }
    }

    // Compute training accuracy
    let correct = 0;
    for (let i = 0; i < numSamples; i++) {
      const x = X[i];
      const labelIndex = y[i];
      const logits = new Array(numClasses).fill(0);
      for (let k = 0; k < numClasses; k++) {
        let z = b[k];
        const wk = W[k];
        for (let j = 0; j < numFeatures; j++) {
          z += wk[j] * x[j];
        }
        logits[k] = z;
      }
      let bestK = 0;
      let bestVal = logits[0];
      for (let k = 1; k < numClasses; k++) {
        if (logits[k] > bestVal) {
          bestVal = logits[k];
          bestK = k;
        }
      }
      if (bestK === labelIndex) correct++;
    }

    const trainAccuracy = correct / (numSamples || 1);

    return new Response(
      JSON.stringify({
        success: true,
        datasetKeys: datasetKeysList,
        targetColumn,
        featureColumns,
        algorithmId: algorithmId || 'simple_neural_net',
        numSamples,
        numFeatures,
        numClasses,
        metrics: {
          trainAccuracy,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    console.error('ML train error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
};
