import express, {Application} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import decisionRoutes from './routes/decision.routes';

const app: Application = express();

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

//mouting the auth routes at /api/auth
app.use('/api/auth', authRoutes);
//mounting the decision routes at /api/decisions
app.use('/api/decisions', decisionRoutes);

//simple route to test
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Decision Engine is running!'
    });
});

export default app;