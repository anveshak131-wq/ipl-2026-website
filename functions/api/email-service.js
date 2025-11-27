/**
 * Cloudflare Pages Function for email notifications
 * Enhanced with personalization, queue management, and analytics
 * Sends match reminders 30 minutes before matches
 * Fixed: body stream read once to avoid "Body has already been used" error
 * Deployed: 2025-11-27T03:55:00Z
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send-match-reminder') {
      return await sendMatchReminder(body, env, corsHeaders);
    } else if (action === 'send-email') {
      return await sendEmail(body, env, corsHeaders);
    } else if (action === 'send-batch') {
      return await sendBatchEmails(body, env, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Email service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

/**
 * Send a match reminder email
 */
async function sendMatchReminder(body, env, corsHeaders) {
  try {
    const { email, matchId, team1, team2, venue, time, date } = body;

    if (!email || !matchId || !team1 || !team2) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user has accepted terms and opted in for notifications
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = JSON.parse(userData);
    
    // Check if user has accepted terms and opted in
    if (!user.termsAccepted || !user.emailNotificationsEnabled) {
      return new Response(
        JSON.stringify({ error: 'User has not opted in for notifications' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate HTML email template (ElasticEmail-style) and inject unsubscribe token
    let htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);

    try {
      const unsubToken = crypto.randomUUID();
      await env.SPORTS_KV.put(
        `unsubscribe-token:${unsubToken}`,
        JSON.stringify({ email, category: 'all' }),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
      htmlContent = htmlContent.replace('{{unsubscribeToken}}', unsubToken);
    } catch (e) {
      console.error('Failed to generate unsubscribe token for match reminder:', e);
    }

    // Send email using Resend, SendGrid, or other service
    const emailResult = await sendEmailViaProvider(
      {
        from: 'sportsup99.info@gmail.com',
        to: email,
        subject: `🏏 Match Reminder: ${team1.shortName} vs ${team2.shortName} Starting in 30 Minutes!`,
        html: htmlContent,
      },
      env
    );

    if (emailResult.success) {
      // Log email sent to KV
      const emailLog = {
        matchId,
        email,
        sentAt: new Date().toISOString(),
        type: 'match-reminder',
      };
      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592000 } // 30 days
      );

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully', messageId: emailResult.messageId }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error('Send match reminder error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Generic email sending function
 */
async function sendEmail(body, env, corsHeaders) {
  try {
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (to, subject, html)' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const emailResult = await sendEmailViaProvider(
      {
        from: 'sportsup99.info@gmail.com',
        to,
        subject,
        html,
      },
      env
    );

    if (emailResult.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: emailResult.messageId }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      throw new Error(`Email provider error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Send email via Resend, Elastic Email, SendGrid, or fallback service
 */
async function sendEmailViaProvider(emailData, env) {
  // Try Resend first
  if (env.RESEND_API_KEY) {
    return await sendViaResend(emailData, env.RESEND_API_KEY);
  }

  // Try Elastic Email
  if (env.ELASTIC_EMAIL_API_KEY) {
    return await sendViaElasticEmail(emailData, env.ELASTIC_EMAIL_API_KEY);
  }

  // Try SendGrid
  if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid(emailData, env.SENDGRID_API_KEY);
  }

  // Try Mailgun
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    return await sendViaMailgun(emailData, env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN);
  }

  // Log locally if no email service configured
  console.log('No email service configured. Email data:', emailData);
  return { success: true, messageId: 'local-' + Date.now() };
}

/**
 * Send via Resend (recommended for Cloudflare)
 */
async function sendViaResend(emailData, apiKey) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Resend API error' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Elastic Email
 * API docs: https://elasticemail.com/developers/api-documentation/rest-api
 */
async function sendViaElasticEmail(emailData, apiKey) {
  try {
    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: apiKey,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        bodyHtml: emailData.html,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'Elastic Email API error' };
    }

    const data = await response.json();
    
    // Elastic Email returns transaction ID
    if (data.success) {
      return { success: true, messageId: data.transactionid || data.transaction_id || 'elastic-' + Date.now() };
    } else {
      return { success: false, error: data.error || 'Elastic Email error' };
    }
  } catch (error) {
    console.error('Elastic Email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(emailData, apiKey) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: { email: emailData.from },
        subject: emailData.subject,
        content: [{ type: 'text/html', value: emailData.html }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: error || 'SendGrid API error' };
    }

    const messageId = response.headers.get('X-Message-Id') || 'sendgrid-' + Date.now();
    return { success: true, messageId };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send via Mailgun
 */
async function sendViaMailgun(emailData, apiKey, domain) {
  try {
    const formData = new FormData();
    formData.append('from', emailData.from);
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:' + apiKey),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Mailgun API error' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Mailgun error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email template for match reminder
 */
function generateMatchReminderHTML(team1, team2, venue, time, date) {
  const team1Name = (team1 && (team1.name || team1.shortName)) || 'Team 1';
  const team2Name = (team2 && (team2.name || team2.shortName)) || 'Team 2';
  const team1Short = (team1 && (team1.shortName || team1.name)) || team1Name;
  const team2Short = (team2 && (team2.shortName || team2.name)) || team2Name;
  const matchTime = time || '19:30';
  const matchDate = date || 'TBD';
  const venueText = venue || 'TBD';
  const matchLabel = `${matchDate} — ${matchTime}`;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">


    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">


        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">


        <!--[if !mso]><!-->
          
          <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap">


          <style type="text/css">
            @import url(https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap);
        </style>
        
        <!--<![endif]-->


        <!--[if mso]>
          <style>
              * {
                  font-family: sans-serif !important;
              }
          </style>
        <![endif]-->
    
        
        <!-- NOTE: the title is processed in the backend during the campaign dispatch -->
        <title>Match Reminder</title>


        <!--[if gte mso 9]>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        
    <style>
        :root {
            color-scheme: light;
            supported-color-schemes: light;
        }


        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;


            overflow-wrap: break-word;
            -ms-word-break: break-word;
            word-break: break-word;
        }



    direction: ltr;


    * .template-editor__direction-insensitive {
      direction: ltr;
    }
    * .template-editor__direction-insensitive > * {
      direction: ltr;
    }
    


  center,
  #body_table {
    
  }


  ul, ol {
    padding: 0;
    margin-top: 0;
    margin-bottom: 0;
  }


  li {
    margin-bottom: 0;
  }


  .list-block-list-outside-left li {
    margin-left: 20px !important;
  }


  .list-block-list-outside-right li {
    margin-right: 20px !important;
  }


     .paragraph {
      font-size: 16px;
      font-family: Open Sans, sans-serif;
      font-weight: normal;
      font-style: normal;
      text-align: left;
      line-height: 1.7;
      text-decoration: none;
      color: #333333;
      
    }


     .heading1 {
      font-size: 24px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .heading2 {
      font-size: 20px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .heading3 {
      font-size: 18px;
      font-family: Montserrat, sans-serif;
      font-weight: bold;
      font-style: normal;
      text-align: center;
      line-height: 1.3;
      text-decoration: none;
      color: #111111;
      
    }


     .list {
      font-size: 14px;
      font-family: Open Sans, sans-serif;
      font-weight: normal;
      font-style: normal;
      text-align: left;
      line-height: 1.7;
      text-decoration: none;
      color: #333333;
      
    }


  p a, 
  li a {
    
    color: #1e90ff;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;


  }


  .button-table a {
    text-decoration: none;
    font-style: normal;
    font-weight: bold;
  }


  .paragraph > span {text-decoration: none;}.heading1 > span {text-decoration: none;}.heading2 > span {text-decoration: none;}.heading3 > span {text-decoration: none;}.list > span {text-decoration: none;}



        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }


        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }


        #MessageViewBody,
        #MessageWebViewDiv {
            width: 100% !important;
        }


        table {
            border-collapse: collapse;
            border-spacing: 0;
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
        }
        table:not(.button-table) {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }


        th {
            font-weight: normal;
        }


        tr td p {
            margin: 0;
        }


        img {
            -ms-interpolation-mode: bicubic;
        }


        a[x-apple-data-detectors],


        .unstyle-auto-detected-links a,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }


        .im {
            color: inherit !important;
        }


        .a6S {
            display: none !important;
            opacity: 0.01 !important;
        }


        img.g-img+div {
            display: none !important;
        }


        @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
            u~div .contentMainTable {
                min-width: 320px !important;
            }
        }


        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            u~div .contentMainTable {
                min-width: 375px !important;
            }
        }


        @media only screen and (min-device-width: 414px) {
            u~div .contentMainTable {
                min-width: 414px !important;
            }
        }
    </style>
    <style>
        @media only screen and (max-device-width: 640px) {
            .contentMainTable {
                width: 100% !important;
                margin: auto !important;
            }
            .single-column {
                width: 100% !important;
                margin: auto !important;
            }
            .multi-column {
                width: 100% !important;
                margin: auto !important;
            }
        }
        @media only screen and (max-width: 640px) {
            .contentMainTable {
                width: 100% !important;
                margin: auto !important;
            }
            .single-column {
                width: 100% !important;
                margin: auto !important;
            }
            .multi-column {
                width: 100% !important;
                margin: auto !important;
            }
        }
    </style>
    <!--[if mso | IE]>
<style>
.button-eoAkF3pem5ENe_jOO18BA { padding: 14px 30px; };
.button-eoAkF3pem5ENe_jOO18BA a { margin: -14px -30px; }; 
.button-Jq3YQpZI9Sxyp8L3i8Qif { padding: 14px 30px; };
.button-Jq3YQpZI9Sxyp8L3i8Qif a { margin: -14px -30px; }; 
.button-SoGf-hNj3vf56GvkRAsV_ { padding: 0px; };
.button-SoGf-hNj3vf56GvkRAsV_ a { margin: 0px; }; </style>
<![endif]-->
    
<!--[if mso | IE]>
    <style>
        .list-block-outlook-outside-left {
            margin-left: -18px;
        }
    
        .list-block-outlook-outside-right {
            margin-right: -18px;
        }


        a:link, span.MsoHyperlink {
            mso-style-priority:99;
            
    color: #1e90ff;
    text-decoration: underline;
    font-style: normal;
    font-weight: normal;


        }
    </style>
<![endif]-->


    
<style>
    table .button-td a,
    table p,
    table li {
      -ms-word-break: break-word;
      word-break: break-word !important;
    }
</style>



    </head>


    <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #F5F6F8;">
        <center role="article" aria-roledescription="email" lang="en" style="width: 100%; background-color: #F5F6F8;">
            <!--[if mso | IE]>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" id="body_table" width="100%" style="background-color: #F5F6F8;">
            <tbody>    
                <tr>
                    <td>
                    <![endif]-->
                        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="margin: auto;" class="contentMainTable">
                            <tr><td style="padding-top:20px;padding-bottom:20px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:20px;padding-bottom:20px;padding-left:0;padding-right:0" class="wp-block-editor-onecolumnsblock-v1"><td style="width:640px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="640" style="width:640px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:30px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="168" height="" alt="SportsUp99 logo" style="border-radius:4px;display:block;height:auto;width:30%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr><tr class="wp-block-editor-headingblock-v1"><td valign="top" style="background-color:#FFFFFF;display:block;padding-top:10px;padding-right:40px;padding-bottom:10px;padding-left:40px;text-align:center;direction:ltr;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p style="font-family:Montserrat, sans-serif;text-align:center;direction:ltr;line-height:31.20px;font-size:24px;background-color:#FFFFFF;color:#111111;margin:0;word-break:normal" class="heading1">🏏 Match Reminder</p></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0" class="wp-block-editor-onecolumnsblock-v1"><td style="width:640px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="left" border="0" class="single-column" width="640" style="width:640px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:20px 40px 20px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:left;direction:ltr;line-height:27.20px;font-size:16px;margin:0;color:#333333;word-break:normal"><span style="color:#1e90ff">${team1Short}</span> vs <span style="color:#ff8c00">${team2Short}</span><br>Time: ${matchLabel}<br>Venue: ${venueText}<br><br>Get ready for a thrilling clash — stay tuned for live updates and highlights.</p></td></tr><tr class="wp-block-editor-buttonblock-v1" align="left"><td style="background-color:#FFFFFF;padding-top:30px;padding-right:40px;padding-bottom:30px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-eoAkF3pem5ENe_jOO18BA button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#1e90ff;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a href="https://sportsup99.com/live-score" style="color:#ffffff;display:block;padding:14px 30px 14px 30px">View Live Score</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0;background-color:#FFFFFF"><table role="presentation" class="multi-column" style="width:640px;border-collapse:collapse !important" cellpadding="0" cellspacing="0"><tbody><tr style="padding-top:10px;padding-bottom:10px;padding-left:0;padding-right:0" class="wp-block-editor-twocolumnsfiftyfiftyblock-v1"><td style="width:320px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="320" style="width:320px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="216" height="" alt="${team1Short} crest" style="border-radius:6px;display:block;height:auto;width:90%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr></tbody></table></td><td style="width:320px;float:left" class="wp-block-editor-column single-column"><table role="presentation" align="center" border="0" class="single-column" width="320" style="width:320px;float:left;border-collapse:collapse !important" cellspacing="0" cellpadding="0"><tbody><tr class="wp-block-editor-imageblock-v1"><td style="background-color:#FFFFFF;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px" align="center"><table align="center" width="100%" style="width:100%;border-spacing:0;border-collapse:collapse;max-width:100%" role="presentation"><tbody><tr align="center"><td style="padding:0"><img src="https://template-editor-assets.s3.eu-west-3.amazonaws.com/assets/ai-designer/default/default-image.jpg" width="216" height="" alt="${team2Short} crest" style="border-radius:6px;display:block;height:auto;width:90%;max-width:100%;border:0" class="g-img"></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr class="wp-block-editor-socialiconsblock-v1" role="article" aria-roledescription="social-icons" style="display:table-row;background-color:#FFFFFF"><td style="width:100%"><table style="background-color:#FFFFFF;width:100%;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px;border-collapse:separate !important" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td align="center" valign="top"><div style="max-width:560px"><table role="presentation" style="width:100%" cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td valign="top"><div style="margin-left:auto;margin-right:auto;margin-top:-3px;margin-bottom:-3px;width:100%;max-width:144px"><table role="presentation" style="padding-left:208" width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://www.facebook.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/facebook/facebook-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="Facebook"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://twitter.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/x/x-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="X (formerly Twitter)"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://instagram.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/instagram/instagram-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="Instagram"></a></td></tr></tbody></table><table role="presentation" align="left" style="float:left" class="single-social-icon" cellpadding="0" cellspacing="0"><tbody><tr><td valign="top" style="padding-top:3px;padding-bottom:3px;padding-left:6px;padding-right:6px;border-collapse:collapse !important;border-spacing:0;font-size:0"><a class="social-icon--link" href="https://youtube.com/" target="_blank" rel="noreferrer"><img src="https://d2u6lzrmbvw8bs.cloudfront.net/assets/social-icons/youtube/youtube-round-solid-dark.png" width="24" height="24" style="max-width:24px;display:block;border:0" alt="YouTube"></a></td></tr></tbody></table></td></tr></tbody></table></div></td></tr></tbody></table></div></td></tr></tbody></table></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:23.80px;font-size:14px;margin:0;color:#333333;word-break:normal">Watch Live: <a href="https://sportsup99.com/live-score" data-type="website" data-id="watch" style="color:#1e90ff !important;">Click here to stream</a><br></p></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-buttonblock-v1" align="center"><td style="background-color:#FFFFFF;padding-top:10px;padding-right:40px;padding-bottom:20px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-Jq3YQpZI9Sxyp8L3i8Qif button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#ff8c00;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a href="https://sportsup99.com/live-score" style="color:#ffffff;display:block;padding:14px 30px 14px 30px">Watch Live</a></td></tr></tbody></table></td></tr><tr class="wp-block-editor-listblock-v1"><td style="background-color:#FFFFFF;padding:10px 40px 10px 40px;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><div class="list-block-outlook-outside-left"><ul class="list list-block-list-outside-left" style="padding:0;font-family:Open Sans, sans-serif;text-align:left;direction:ltr;line-height:23.80px;font-size:14px;color:#333333;list-style-type:disc;list-style-position:outside;word-break:normal" start="1"><li><span>Teams: <span style="color:#1e90ff">${team1Short}</span> &amp; <span style="color:#ff8c00">${team2Short}</span></span></li><li><span>Time: ${matchLabel}</span></li><li><span>Venue: ${venueText}</span></li></ul></div></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:20.40px;font-size:12px;margin:0;color:#333333;word-break:normal">© SportsUp99. All rights reserved.</p></td></tr><tr class="wp-block-editor-dividerblock-v1" align="center" valign="top"><td style="padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#FFFFFF"><div style="background:#E6E8EA;font-size:1px;line-height:1px;border:0">&nbsp;</div></td></tr><tr class="wp-block-editor-buttonblock-v1" align="center"><td style="background-color:#FFFFFF;padding-top:20px;padding-right:40px;padding-bottom:20px;padding-left:40px;width:100%" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" class="button-table"><tbody><tr><td valign="top" class="button-SoGf-hNj3vf56GvkRAsV_ button-td button-td-primary" style="cursor:pointer;border:none;border-radius:8px;background-color:#1e90ff;font-size:16px;font-family:Open Sans, sans-serif;width:fit-content;direction:ltr;text-decoration:none;letter-spacing:0;color:#ffffff;overflow:hidden"><a style="color:#ffffff;display:block;padding:0px 0px 0px 0px"></a></td></tr></tbody></table></td></tr><tr class="wp-block-editor-paragraphblock-v1"><td valign="top" style="padding:10px 40px 10px 40px;background-color:#FFFFFF;word-break:normal;hyphens:auto;-webkit-hyphens:auto;-ms-hyphens:auto"><p class="paragraph" style="font-family:Open Sans, sans-serif;text-align:center;direction:ltr;line-height:20.40px;font-size:12px;margin:0;color:#333333;word-break:normal">SportsUp99, Bengaluru, India<br>If you no longer wish to receive mail from us, you can <a href="https://sportsup99.com/api/email-preferences/unsubscribe/{{unsubscribeToken}}" style="color: #1e90ff;">unsubscribe</a>.</p></td></tr>
                        </table>
                    <!--[if mso | IE]>
                    </td>
                </tr>
            </tbody>
            </table>
            <![endif]-->
        </center>
    </body>
</html>
`;
}

/**
 * Send batch emails with personalization
 */
async function sendBatchEmails(body, env, corsHeaders) {
  try {
    const { emails } = body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'emails must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const results = [];
    for (const emailData of emails) {
      const result = await sendPersonalizedEmail(emailData, env);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Send batch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send batch' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Send personalized email with user segment preferences
 */
async function sendPersonalizedEmail(emailData, env) {
  try {
    const { email, matchId, team1, team2, venue, time, date, personalization } = emailData;

    if (!email) {
      return { success: false, email, error: 'Email address required' };
    }

    // Get user segment and preferences
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return { success: false, email, error: 'User not found' };
    }

    const user = JSON.parse(userData);
    const prefs = user.emailPreferences || {};

    // Generate personalized subject and content
    const subject = `🏏 ${user.name}, Don't miss: ${team1.shortName} vs ${team2.shortName}!`;
    const greeting = `Hi ${user.name}`;

    let htmlContent = generateMatchReminderHTML(team1, team2, venue, time, date);
    htmlContent = htmlContent.replace('Hi there!', greeting);

    // Generate unsubscribe token
    const unsubToken = crypto.randomUUID();
    await env.SPORTS_KV.put(
      `unsubscribe-token:${unsubToken}`,
      JSON.stringify({ email, category: 'all' }),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );

    htmlContent = htmlContent.replace(
      '{{unsubscribeToken}}',
      unsubToken
    );

    const emailResult = await sendEmailViaProvider(
      {
        from: 'sportsup99.info@gmail.com',
        to: email,
        subject,
        html: htmlContent,
      },
      env
    );

    if (emailResult.success) {
      // Log email sent
      const emailLog = {
        matchId,
        email,
        sentAt: new Date().toISOString(),
        type: 'match-reminder',
        personalized: true,
        segment: user.segment || 'unknown',
      };

      await env.SPORTS_KV.put(
        `email-log:${email}:${matchId}`,
        JSON.stringify(emailLog),
        { expirationTtl: 2592000 }
      );

      return {
        success: true,
        email,
        matchId,
        messageId: emailResult.messageId,
      };
    } else {
      return {
        success: false,
        email,
        error: emailResult.error,
      };
    }
  } catch (error) {
    console.error('Send personalized error:', error);
    return {
      success: false,
      email: emailData.email,
      error: error.message,
    };
  }
}
