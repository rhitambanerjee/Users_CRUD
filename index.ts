import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'
import { initUser, User } from './models/user';
import { initItem, Item } from './models/item';

const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config()

const secret_key=process.env.SECRET_KEY

// Database configuration
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'UserDetails',
});

// Initialize models
initUser(sequelize);
initItem(sequelize);

// Synchronize database
sequelize.sync();

// Middleware for authentication
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, 'secret_key', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Routes
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });

  if (!user || user.password !== password) {
    return res.sendStatus(401);
  }

  const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });

  res.json({ token });
});

app.get('/api/items', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.id;
  const items = await Item.findAll({ where: { userId } });

  res.json(items);
});

app.post('/api/items', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { name, description } = req.body;

  const item = await Item.create({ name, description, userId });

  res.json(item);
});

app.put('/api/items/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { name, description } = req.body;
  const itemId = parseInt(req.params.id);

  const item = await Item.findOne({ where: { id: itemId, userId } });

  if (!item) {
    return res.sendStatus(404);
  }

  item.name = name;
  item.description = description;
  await item.save();

  res.json(item);
});

app.delete('/api/items/:id', authenticate, async (req: Request, res: Response) => {
  const userId = req.user.id;
  const itemId = parseInt(req.params.id);

  const item = await Item.findOne({ where: { id: itemId, userId } });

  if (!item) {
    return res.sendStatus(404);
  }

  await item.destroy();

  res.json({ message: 'Item deleted' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
