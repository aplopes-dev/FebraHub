"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("../src/app.module");
const out = (0, path_1.resolve)(__dirname, '../../../../../packages/docs/api/clinica-openapi.json');
async function main() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Clinica API')
        .setDescription('Vertical clínica — gestão de clínica')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    (0, fs_1.mkdirSync)((0, path_1.dirname)(out), { recursive: true });
    (0, fs_1.writeFileSync)(out, JSON.stringify(document, null, 2));
    await app.close();
    console.log('clinica-openapi.json → packages/docs/api/');
}
main();
//# sourceMappingURL=export-openapi.js.map