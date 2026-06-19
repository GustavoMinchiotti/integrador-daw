import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { GestionModule } from './modules/gestion/gestion.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const commonOptions = {
          type: 'postgres' as const,
          synchronize: false,
          autoLoadEntities: true,
          logging: configService.get<string>('DB_LOGGING') === 'true',
          logger: 'advanced-console' as const,
        };

        if (databaseUrl) {
          return {
            ...commonOptions,
            url: databaseUrl,
            ssl:
              configService.get<string>('DB_SSL') === 'false'
                ? false
                : { rejectUnauthorized: false },
          };
        }

        return {
          ...commonOptions,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
        };
      },
    }),
    AuthModule,
    GestionModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
