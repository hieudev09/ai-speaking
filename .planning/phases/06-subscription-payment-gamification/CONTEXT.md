# Phase 6: Subscription, Payment, Gamification & Notifications — Context

**Status:** Completed
**Domain:** Monetization (Stripe & Sandbox Checkout, Subscriptions, Quota enforcement), Gamification (Daily streak retention engine, Achievement unlocking with real-time conditions), In-app and BullMQ Notifications, Personalized Adaptive Recommendations, and Full Frontend Suite (Pricing, Success/Cancel flows, Dashboard, and Notification Center).

## Deliverables Completed:

1. **Shared Types (`packages/types`)**:
   - `UserSubscriptionDto`, `QuotaStatusDto`, `CreateCheckoutDto`, `CheckoutResponseDto`, `PaymentDto`, `InvoiceDto`
   - `UserStreakDto`, `AchievementDto`, `UserAchievementDto`
   - `NotificationDto`, `CreateNotificationDto`
   - `RecommendationDto`, `UserRecommendationsDto`

2. **Gamification Module (`apps/api/src/modules/gamification`)**:
   - `GamificationService`:
     - Streak retention engine: daily activity recording, streak preservation/increment/reset, longest streak tracking
     - Real-time achievement unlock engine: checks conditions (`conversation_count`, `streak_days`, `speaking_count`)
     - Celebratory in-app notification creation on unlock
   - `GamificationController`:
     - `GET /api/v1/gamification/streak`
     - `GET /api/v1/gamification/achievements`
     - `POST /api/v1/gamification/record-activity`
   - Integration with `ConversationsService`: automatic activity logging on message exchange

3. **Subscriptions & Quota Module (`apps/api/src/modules/subscriptions`)**:
   - `SubscriptionsService`:
     - Available tier plans (Free, Premium Monthly $9.99, Premium Yearly $79.99)
     - Current subscription details & validity calculation
     - Quota engine: Free plan limit of 10 daily sessions (`FREE_PLAN_DAILY_LIMIT`), unlimited (-1) for Premium
   - `QuotaGuard`:
     - Guards endpoints against quota breaches with 403 Quota Exceeded and upgrade prompt
   - `SubscriptionsController`:
     - `GET /api/v1/subscriptions/plans`
     - `GET /api/v1/subscriptions/current`
     - `GET /api/v1/subscriptions/quota`
     - `POST /api/v1/subscriptions/upgrade`

4. **Payments Module (`apps/api/src/modules/payments`)**:
   - `PaymentsService`:
     - Stripe Checkout API integration with automatic fallback to Sandbox/Mock dev mode
     - Webhook handler for `checkout.session.completed`
     - Automatic plan upgrade to `PREMIUM` upon successful payment
     - Automatic `Payment` and itemized `Invoice` creation
   - `PaymentsController`:
     - `POST /api/v1/payments/checkout`
     - `POST /api/v1/payments/webhook`
     - `POST /api/v1/payments/mock-complete`
     - `GET /api/v1/payments/history`

5. **Notifications Module (`apps/api/src/modules/notifications`)**:
   - `NotificationsService`:
     - In-app notification retrieval, unread count badge counter
     - `markAsRead` and `markAllAsRead`
     - Dispatch to BullMQ `notification_queue`
   - `NotificationsController`:
     - `GET /api/v1/notifications`
     - `GET /api/v1/notifications/unread-count`
     - `PATCH /api/v1/notifications/:id/read`
     - `PATCH /api/v1/notifications/read-all`

6. **Recommendations Module (`apps/api/src/modules/recommendations`)**:
   - `RecommendationsService`:
     - Synthesizes 5-dimension speech assessment metrics across past sessions
     - Identifies weakest skill (Pronunciation, Fluency, Grammar, Vocabulary)
     - Curates tailored practice lessons and conversation scenarios
   - `RecommendationsController`:
     - `GET /api/v1/recommendations`

7. **Background Workers (`apps/workers`)**:
   - `NotificationProcessor`:
     - Pulls from `notification_queue`, checks user notification preferences, and persists in-app notifications
   - `EmailProcessor`:
     - Handlers for `payment_receipt`, `achievement_unlocked`, and `streak_reminder`

8. **Frontend Web Application (`apps/web`)**:
   - `lib/`: `subscriptions.ts`, `payments.ts`, `gamification.ts`, `notifications.ts`, `recommendations.ts`
   - `components/NotificationBell.tsx`: Dropdown notification center with live badge counter and mark-as-read
   - `app/pricing/page.tsx`: Tier comparison table, monthly/yearly billing toggle (33% discount), and checkout trigger
   - `app/pricing/success/page.tsx`: Celebration screen with activated plan confirmation
   - `app/pricing/cancel/page.tsx`: Cancellation screen with retry option
   - `app/dashboard/page.tsx`: Comprehensive user hub featuring:
     - Streak Flame Counter & daily status
     - Daily Practice Quota progress bar & Premium unlimited indicator
     - Adaptive Learning Path with weakness focus badges
     - Gamified Achievements showcase (unlocked medals & progress bars)
   - `app/page.tsx`: Updated hero with direct Dashboard & Pricing links and Phase 6 status badge
