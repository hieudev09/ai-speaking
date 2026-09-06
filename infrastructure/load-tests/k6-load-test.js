import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },    // Ramp-up to 500 VUs
    { duration: '1m', target: 2000 },     // Ramp-up to 2,000 VUs
    { duration: '2m', target: 10000 },    // Peak load: 10,000 concurrent users
    { duration: '1m', target: 10000 },    // Sustain peak load
    { duration: '1m', target: 0 },        // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  // 1. Check Course Catalog
  const coursesRes = http.get(`${BASE_URL}/courses`);
  check(coursesRes, {
    'courses status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Check Subscription Plans
  const plansRes = http.get(`${BASE_URL}/subscriptions/plans`);
  check(plansRes, {
    'plans status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Simulated User Event Tracking
  const eventPayload = JSON.stringify({
    eventName: 'user_active_ping',
    eventData: { client: 'k6-load-test' },
  });

  const eventRes = http.post(`${BASE_URL}/analytics/events`, eventPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(eventRes, {
    'event tracking status is 201 or 200': (r) => r.status === 200 || r.status === 201,
  });

  sleep(2);
}
