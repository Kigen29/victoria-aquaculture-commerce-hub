# Lake Victoria Aquaculture E-commerce Platform

A modern e-commerce platform for Lake Victoria Aquaculture, built with React, TypeScript, and Supabase. This platform enables customers to browse and purchase aquaculture products, manage orders, and process payments through Pesapal integration.

## 🚀 Features

- **Product Catalog**: Browse aquaculture products with category filtering
- **Shopping Cart**: Add/remove products with persistent cart state
- **User Authentication**: Secure login/registration with Supabase Auth
- **Payment Processing**: Integrated Pesapal payment gateway for secure transactions
- **Order Management**: Track orders and view order history
- **Blog System**: Content management for articles and updates
- **Newsletter**: Email subscription functionality
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Admin Dashboard**: Manage products, orders, and content

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Payment**: Pesapal Gateway Integration
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router DOM
- **Deployment**: Lovable Platform

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Pesapal merchant account (for payment processing)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pesapal Configuration (for edge functions)
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations found in `supabase/migrations/`
3. Configure Row Level Security (RLS) policies for your tables
4. Set up the required edge functions for payment processing

### 5. Supabase Configuration

Configure the following in your Supabase dashboard:

- **Authentication**: Enable email/password and social providers as needed
- **Edge Functions**: Deploy the Pesapal integration functions
- **Secrets**: Add `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── checkout/       # Checkout and payment components
│   ├── home/           # Homepage sections
│   ├── layout/         # Layout components (Navbar, Footer)
│   ├── shop/           # Product catalog components
│   └── ui/             # shadcn/ui base components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
├── lib/                # Utility functions and configurations
├── pages/              # Page components
└── services/           # API service functions

supabase/
├── functions/          # Edge functions for backend logic
└── migrations/         # Database schema and migrations
```

## 💳 Payment Integration

The platform uses Pesapal for payment processing:

1. **Order Creation**: Creates orders via Supabase edge function
2. **Payment Processing**: Redirects to Pesapal payment page
3. **Callback Handling**: Processes payment status updates
4. **Order Completion**: Updates order status and sends confirmations

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- User authentication with Supabase Auth
- Secure payment processing through Pesapal
- Input validation and sanitization
- HTTPS enforcement in production

## 🚀 Deployment

### Lovable Platform (Recommended)

1. Connect your GitHub repository to Lovable
2. Click "Publish" in the Lovable editor
3. Configure custom domain if needed

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `PESAPAL_CONSUMER_KEY` | Pesapal consumer key (edge functions) | Yes |
| `PESAPAL_CONSUMER_SECRET` | Pesapal consumer secret (edge functions) | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📧 Support

For support and questions:
- Create an issue in this repository
- Contact the development team

## 📄 License

This project is proprietary software for Lake Victoria Aquaculture.

---

Built with ❤️ for sustainable aquaculture