import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

/**
 * Arranca el servidor Nest con configuración global y CORS seguro.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config_service = app.get(ConfigService)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors({ origin: config_service.get('FRONTEND_URL') ?? '*', credentials: true })
  await app.listen(Number(config_service.get('PORT') ?? 3000))
}

void bootstrap()
