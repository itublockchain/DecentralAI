import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './config/logger';
import { contributeRoutes } from './routes/contribute.routes';
import { errorHandler } from './middlewares/error-handler.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString() 
    });
});

app.use('/api', contributeRoutes);

app.use(errorHandler);

const PORT = env.PORT;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
});