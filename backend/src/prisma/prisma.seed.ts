import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
    },
  });

  const products = [
  { 
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse',
    imageUrl: 'https://source.unsplash.com/300x300/?wireless-mouse',
    price: 29.99,
    stockQuantity: 50
  },
  { 
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard',
    imageUrl: 'https://source.unsplash.com/300x300/?mechanical-keyboard',
    price: 89.99,
    stockQuantity: 30
  },
  { 
    name: 'USB-C Hub',
    description: '7-in-1 USB-C hub',
    imageUrl: 'https://source.unsplash.com/300x300/?usb-c-hub',
    price: 45.99,
    stockQuantity: 40
  },
  { 
    name: '27" 4K Monitor',
    description: '27 inch 4K IPS monitor',
    imageUrl: 'https://source.unsplash.com/300x300/?computer-monitor',
    price: 349.99,
    stockQuantity: 15
  },
  { 
    name: 'Noise Cancelling Headphones',
    description: 'Over-ear Bluetooth ANC headphones',
    imageUrl: 'https://source.unsplash.com/300x300/?noise-cancelling-headphones',
    price: 199.99,
    stockQuantity: 25
  },
  { 
    name: 'Webcam 1080p',
    description: 'Full HD webcam with microphone',
    imageUrl: 'https://source.unsplash.com/300x300/?webcam',
    price: 59.99,
    stockQuantity: 35
  },
  { 
    name: 'Portable SSD 1TB',
    description: '1TB portable SSD USB 3.2',
    imageUrl: 'https://source.unsplash.com/300x300/?portable-ssd',
    price: 109.99,
    stockQuantity: 20
  },
];

  for (const p of products) {
    await prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());