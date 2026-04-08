'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Inserisci la tua email')
    .email('Formato email non valido'),
  password: z
    .string()
    .min(1, 'Inserisci la tua password')
    .min(6, 'La password deve essere di almeno 6 caratteri'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email o password non corretti',
  email_not_confirmed: 'Email non confermata. Controlla la tua casella di posta',
  too_many_requests: 'Troppi tentativi. Riprova tra qualche minuto',
}

function mapErrorMessage(error: string): string {
  const lower = error.toLowerCase()
  if (lower.includes('invalid') || lower.includes('credentials')) {
    return AUTH_ERROR_MESSAGES.invalid_credentials
  }
  if (lower.includes('not confirmed') || lower.includes('email')) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed
  }
  if (lower.includes('rate') || lower.includes('too many')) {
    return AUTH_ERROR_MESSAGES.too_many_requests
  }
  return 'Si e verificato un errore. Riprova.'
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    const result = await login(values.email, values.password)
    if (!result.ok) {
      setServerError(mapErrorMessage(result.error.message))
      return
    }
    router.replace('/')
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            <span className="text-primary">67</span> Hub
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Accedi al tuo account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
