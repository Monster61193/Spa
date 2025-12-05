import { Test, TestingModule } from "@nestjs/testing";
import { ServicesService } from "./services.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

// Tipado como 'any' para flexibilidad total en los mocks
const mock_prisma: any = {
  servicio: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  servicioSucursal: {
    findMany: jest.fn(),
  },
};

describe("ServicesService", () => {
  let service: ServicesService;

  beforeEach(async () => {
    // CAMBIO IMPORTANTE: resetAllMocks() borra las implementaciones (mockResolvedValue)
    // de los tests anteriores. clearAllMocks() solo borraba contadores.
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  describe("crear", () => {
    it("debe crear un servicio mapeando precio_base a precioBase", async () => {
      // ARRANGE
      const payload = {
        nombre: "Nuevo Servicio",
        precio_base: 500,
        duracion_minutos: 60,
      };

      // Definimos el éxito para este test
      mock_prisma.servicio.create.mockResolvedValue({
        id: "srv-1",
        ...payload,
      });

      // ACT
      await service.crear(payload);

      // ASSERT
      expect(mock_prisma.servicio.create).toHaveBeenCalledWith({
        data: {
          nombre: "Nuevo Servicio",
          descripcion: undefined,
          precioBase: 500,
          duracionMinutos: 60,
          activo: true,
          serviciosMateriales: { create: undefined },
        },
      });
    });

    it("debe lanzar ConflictException si Prisma falla por duplicidad", async () => {
      // ARRANGE
      // Creamos el error con el prototipo correcto para pasar el 'instanceof'
      const error_prisma = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["nombre"] },
        }
      );

      // Forzamos el rechazo. Al usar resetAllMocks arriba,
      // aseguramos que no quede basura del test anterior.
      mock_prisma.servicio.create.mockRejectedValue(error_prisma);

      // ACT & ASSERT
      await expect(
        service.crear({
          nombre: "Duplicado",
          precio_base: 10,
          duracion_minutos: 10,
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("actualizar", () => {
    it("debe actualizar campos parciales", async () => {
      // Configuramos respuestas de éxito
      mock_prisma.servicio.findUnique.mockResolvedValue({ id: "srv-1" });
      mock_prisma.servicio.update.mockResolvedValue({ id: "srv-1" });

      await service.actualizar("srv-1", { precio_base: 999 });

      expect(mock_prisma.servicio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "srv-1" },
          data: expect.objectContaining({ precioBase: 999 }),
        })
      );
    });
  });
});
