# Firebase Migration Blueprint - Trusted Choice OMS

This project has been migrated from Supabase to **Firebase** (Firestore, Authentication, and Storage).

## Database Schema (Firestore)

All collections are migrated to top-level collections in Firestore:

- `products`: Product inventory.
- `orders`: Sales records.
- `customers`: Customer profiles.
- `expenses`: Business expenses.
- `suppliers`: Supplier information.
- `drivers`: Delivery driver profiles.
- `deliveries`: Order delivery status.
- `users`: Application user profiles (linked to Firebase Auth UID).
- `purchase_orders`: Inbound stock orders.
- `requests`: Website contact/order requests.
- `notifications`: System alerts.

## Authentication

- **Provider**: Email/Password.
- **Provider Status**: **MUST BE ENABLED** in Firebase Console -> Authentication -> Sign-in method.
- **Root Admin**: `manager@web.com` / `Ahmed@123`.

## Storage

- **Bucket**: Default Firebase Storage bucket.
- **Pathing**: `users/{userId}/{feature}/{itemId}/{fileName}`.

## Configuration

- `firebase-applet-config.json`: Contains the public configuration for initialized the SDK.
- `src/firebase.ts`: SDK initialization and exports (`db`, `auth`, `storage`).
- `src/firebaseService.ts`: Core logic for CRUD, authentication, and subscriptions.

## Security Rules

Security rules are deployed to Firestore to ensure:
1. Public read-only access for `products`.
2. Authenticated-only access for orders and other sensitive collections.
3. User profiling restricted to the owner's UID.

## Post-Migration Steps

1. **Enable Authentication**: Go to the Firebase Console and enable the **Email/Password** sign-in provider.
2. **Review Data**: Managed items can now be seen in the Firestore Data탭.
