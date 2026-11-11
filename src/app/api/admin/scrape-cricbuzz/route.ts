import {
  createCricbuzzOptionsResponse,
  handleScrapeCricbuzzRequest,
} from '../../../../../functions/_cricbuzzScraper';

export async function POST(req: Request) {
  return handleScrapeCricbuzzRequest(req);
}

export async function OPTIONS() {
  return createCricbuzzOptionsResponse();
}
