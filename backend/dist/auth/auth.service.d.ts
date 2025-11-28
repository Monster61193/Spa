import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
export declare class AuthService {
    private readonly prisma;
    private readonly jwt_service;
    constructor(prisma: PrismaService, jwt_service: JwtService);
    login(payload: LoginDto): Promise<{
        access_token: string;
        user: {
            email: string;
            nombre: string;
        };
    }>;
}
