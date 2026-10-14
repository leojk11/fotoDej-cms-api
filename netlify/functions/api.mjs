import serverless from 'serverless-http';
import { withLambda } from '@netlify/aws-lambda-compat';

import app from '../../app.js';

// image routes stream files from R2, so image responses must be sent as binary
const handleRequest = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});

export default withLambda(async (event, context) => {
  // reuse the db connection between warm invocations, don't wait for open handles
  context.callbackWaitsForEmptyEventLoop = false;

  await app.ready();
  return handleRequest(event, context);
});

// every path goes to the Express app
export const config = {
  path: '/*'
};
