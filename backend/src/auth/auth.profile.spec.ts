import { Test } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController /auth/profile', () => {
  let app: INestApplication;

  type RequestWithUser = {
    user?: {
      id: number;
      rol: string;
    };
  };

  const servicioAuthMock = {
    login: jest.fn(),
    getProfile: jest.fn<(userId: number) => Promise<any>>().mockResolvedValue({
      id: 1,
      email: 'admin@viveres.com',
      nombre: 'Admin',
      apellido: 'Sistema',
      rol: 'ADMIN',
    }),
  };

  const guardJwtMock: CanActivate = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = { id: 1, rol: 'ADMIN' };
      return true;
    },
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: servicioAuthMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guardJwtMock)
      .compile();

    app = modulo.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns complete user profile from authenticated request', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer).get('/auth/profile').expect(200);

    expect(servicioAuthMock.getProfile).toHaveBeenCalledWith(1);
    expect(response.body).toEqual({
      id: 1,
      email: 'admin@viveres.com',
      nombre: 'Admin',
      apellido: 'Sistema',
      rol: 'ADMIN',
    });
  });
});
