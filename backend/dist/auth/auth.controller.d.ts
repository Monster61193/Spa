import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
export declare class AuthController {
    private readonly auth_service;
    constructor(auth_service: AuthService);
    login(payload: LoginDto): Promise<{
        access_token: string;
        user: {
            email: string;
            nombre: string;
        };
    }>;
}
