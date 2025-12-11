import { Test, TestingModule } from "@nestjs/testing";
import { PromotionsService } from "./promotions.service";
import { PrismaService } from "../prisma/prisma.service";

const mock_prisma: any = {
  promocion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe("PromotionsService", () => {
  let service: PromotionsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe("validar_y_calcular", () => {
    const mock_promo_base = {
      id: "promo-1",
      nombre: "Descuento Verano",
      estado: true,
      fechaInicio: new Date("2025-01-01"),
      fechaFin: new Date("2025-12-31"), // Vigente en el futuro
      sucursalId: null, // Global
      descuento: 10, // 10%
      promocionServicios: [], // Aplica a todo
    };

    it("debe aplicar descuento correctamente si cumple condiciones", async () => {
      mock_prisma.promocion.findUnique.mockResolvedValue(mock_promo_base);

      const resultado = await service.validar_y_calcular(
        "promo-1",
        "suc-1",
        ["srv-1"],
        1000 // Total
      );

      expect(resultado.valido).toBe(true);
      expect(resultado.promo?.monto_descuento).toBe(100); // 10% de 1000
    });

    it("debe fallar si la promoción caducó", async () => {
      mock_prisma.promocion.findUnique.mockResolvedValue({
        ...mock_promo_base,
        fechaFin: new Date("2020-01-01"), // Pasado
      });

      const resultado = await service.validar_y_calcular(
        "promo-1",
        "suc-1",
        ["srv-1"],
        1000
      );

      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toMatch(/caducado/i);
    });

    it("debe fallar si la promoción es de otra sucursal", async () => {
      mock_prisma.promocion.findUnique.mockResolvedValue({
        ...mock_promo_base,
        sucursalId: "suc-otra", // Sucursal diferente
      });

      const resultado = await service.validar_y_calcular(
        "promo-1",
        "suc-actual",
        ["srv-1"],
        1000
      );

      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toMatch(/no aplica en esta sucursal/i);
    });

    it("debe fallar si no aplica a los servicios seleccionados (Targeting)", async () => {
      mock_prisma.promocion.findUnique.mockResolvedValue({
        ...mock_promo_base,
        promocionServicios: [{ servicioId: "srv-especial" }], // Solo para servicio especial
      });

      const resultado = await service.validar_y_calcular(
        "promo-1",
        "suc-1",
        ["srv-comun"], // El cliente lleva otro servicio
        1000
      );

      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toMatch(
        /no aplica a ninguno de los servicios/i
      );
    });
  });
});
