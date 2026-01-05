"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const health_1 = __importDefault(require("./routes/health"));
const listings_1 = __importDefault(require("./routes/listings"));
const ai_1 = __importDefault(require("./routes/ai"));
const auth_1 = __importDefault(require("./routes/auth"));
const images_1 = __importDefault(require("./routes/images"));
(0, config_1.validateConfig)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
const staticDir = path_1.default.join(process.cwd(), 'clothing_photos');
if (fs_1.default.existsSync(staticDir)) {
    app.use('/static', express_1.default.static(staticDir));
}
app.use('/health', health_1.default);
app.use('/auth', auth_1.default);
app.use('/listings', listings_1.default);
app.use('/ai', ai_1.default);
app.use('/images', images_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});
app.listen(config_1.config.port, () => {
    console.log(`API running on port ${config_1.config.port}`);
});
