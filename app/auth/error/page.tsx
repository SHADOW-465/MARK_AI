import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 font-bold text-xl text-primary mb-4">
            <span>EduGrade</span>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {params?.error ? (
                  <p className="text-sm text-muted-foreground">Error: {params.error}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">An unspecified error occurred during authentication.</p>
                )}
                <Link href="/auth/login">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
