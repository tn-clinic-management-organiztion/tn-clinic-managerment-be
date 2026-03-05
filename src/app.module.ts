import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerMiddleware } from 'src/common/middleware/logger.middleware';
import { AiCoreModule } from 'src/modules/ai-core/ai-core.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ClinicalModule } from 'src/modules/clinical/clinical.module';
import { IamModule } from 'src/modules/iam/iam.module';
import { ParaclinicalModule } from 'src/modules/paraclinical/paraclinical.module';
import { QueueModule } from 'src/modules/queue/queue.module';
import { ReceptionModule } from 'src/modules/reception/reception.module';
import { SystemModule } from 'src/modules/system/system.module';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';
import { ALL_ENTITIES } from 'src/shared/Tables/all_entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false
      })
    }),
    CloudinaryModule,
    AuthModule,
    ParaclinicalModule,
    AiCoreModule,
    IamModule,
    SystemModule,
    ClinicalModule,
    ReceptionModule,
    QueueModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
