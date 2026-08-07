import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Límite de errores global. Captura cualquier error de render en el árbol de
 * componentes y muestra una pantalla amigable en lugar de dejar la aplicación
 * en blanco, con la opción de reintentar o recargar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Algo salió mal</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Ocurrió un error inesperado al mostrar esta sección. Puedes intentar de nuevo o
            recargar la página. Si el problema persiste, contacta al soporte.
          </p>
        </div>
        {this.state.error?.message && (
          <pre className="max-w-md overflow-auto rounded-lg bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={this.handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button onClick={() => window.location.reload()}>Recargar página</Button>
        </div>
      </div>
    );
  }
}
