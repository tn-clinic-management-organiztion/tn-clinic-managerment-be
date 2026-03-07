import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('TN Clinic Management API')
    .setDescription(
      [
        '## TN Clinic Management Backend',
        '',
        '- Hệ thống quản lý phòng khám tích hợp AI',
        '- Tất cả response (trừ một số API đặc biệt có `SkipTransform`) đều tuân theo format:',
        '',
        '```json',
        '{',
        '  "success": true,',
        '  "message": "OK",',
        '  "data": { ...payloadThựcTế }',
        '}',
        '```',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token theo format: Bearer {token}',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
