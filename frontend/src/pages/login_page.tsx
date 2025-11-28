import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/auth.context'

// Esquema de validación con Zod
const LoginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(3, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof LoginSchema>

/**
 * Pantalla de inicio de sesión.
 * Maneja la captura de credenciales y retroalimentación de errores.
 */
export const LoginPage = () => {
  const { login, isLoading } = useAuth()
  const [error_global, set_error_global] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  })

  const handle_submit: SubmitHandler<LoginFormValues> = async (data) => {
    set_error_global(null)
    try {
      await login(data.email, data.password)
      // Si el login funciona, el estado global cambia y App.tsx nos redirige
    } catch (error: any) {
      console.error('Error en login:', error)
      const mensaje = error.response?.data?.message ?? 'Error al iniciar sesión'
      set_error_global(mensaje)
    }
  }

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f4f6fb'
    }}>
      <section className="panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
        
        {error_global && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: '6px',
            fontSize: '0.9rem'
          }}>
            {error_global}
          </div>
        )}

        <form onSubmit={handleSubmit(handle_submit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              disabled={isLoading}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
              {...register('email')}
            />
            {errors.email && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email.message}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              disabled={isLoading}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
              {...register('password')}
            />
            {errors.password && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </div>
  )
}