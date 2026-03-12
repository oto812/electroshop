# MVP Scope

## Included Features

- User registration and JWT authentication
- Product catalog with stock management
- Shopping cart (guest + authenticated with merge)
- Order placement with address geocoding
- Real-time order status updates via WebSocket
- Ephemeral chat between customer and admin per order
- Admin product CRUD (add, edit, delete)
- Admin order management with status updates
- Admin map view showing order delivery locations
- Responsive UI with Tailwind CSS and Shadcn/ui
- Docker Compose deployment (frontend, backend, database)
- Idempotent database seeding

## Excluded Features (Future)

- Email notifications
- Payment gateway integration (currently dummy payment ID)
- Product images upload (currently URL-based)
- Product categories and search/filter
- Pagination for products and orders
- User profile management
- Password reset flow
- Order cancellation
- Inventory alerts
- Analytics dashboard
- Rate limiting and throttling
- CI/CD pipeline
- Production SSL/TLS configuration
- Persistent chat history (currently ephemeral)
- Multiple delivery addresses per user
- Product reviews and ratings