import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config, validateConfig } from './config';
import healthRoute from './routes/health';
import listingsRoute from './routes/listings';
import aiRoute from './routes/ai';
validateConfig();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
const staticDir = path.join(process.cwd(), 'clothing_photos');
if (fs.existsSync(staticDir)) {
    app.use('/static', express.static(staticDir));
}
app.use('/health', healthRoute);
app.use('/listings', listingsRoute);
app.use('/ai', aiRoute);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});
app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
});
