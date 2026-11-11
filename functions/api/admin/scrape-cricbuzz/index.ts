import {
  createCricbuzzOptionsResponse,
  handleScrapeCricbuzzRequest,
} from '../../../_cricbuzzScraper';

export async function onRequestPost(context: any) {
  return handleScrapeCricbuzzRequest(context.request);
}

export async function onRequestOptions() {
  return createCricbuzzOptionsResponse();
}
