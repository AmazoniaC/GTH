import { useNavigate } from 'react-router-dom';
import { Network, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrgChart } from '@/features/employees/employees.api';
import { getInitials } from '@/lib/utils';
import type { OrgNode } from '@/types';

interface TreeNode extends OrgNode {
  children: TreeNode[];
}

function buildTree(nodes: OrgNode[]): { roots: TreeNode[]; orphanCount: number } {
  const map = new Map<string, TreeNode>();
  nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return { roots, orphanCount: roots.length };
}

export function OrgChartPage() {
  const { data, isLoading } = useOrgChart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Organigrama" description="Estructura jerárquica de la organización." />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { roots } = buildTree(data ?? []);

  return (
    <div>
      <PageHeader
        title="Organigrama"
        description="Estructura jerárquica según el jefe directo de cada empleado."
      />
      {roots.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Network className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Aún no hay estructura definida</p>
          <p className="text-sm text-muted-foreground">
            Asigna un jefe directo a los empleados para construir el organigrama.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-6">
          <div className="min-w-fit space-y-6">
            {roots.map((root) => (
              <NodeBranch key={root.id} node={root} onSelect={(n) => navigate(`/employees/${n.documentNumber}`)} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function NodeBranch({ node, onSelect }: { node: TreeNode; onSelect: (n: TreeNode) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <PersonCard node={node} onSelect={onSelect} />
      {node.children.length > 0 && (
        <div className="ml-6 flex flex-col gap-3 border-l-2 border-border pl-6">
          {node.children.map((child) => (
            <NodeBranch key={child.id} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ node, onSelect }: { node: TreeNode; onSelect: (n: TreeNode) => void }) {
  return (
    <button
      onClick={() => onSelect(node)}
      className="group flex w-fit items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <Avatar className="h-10 w-10">
        {node.photoUrl ? <AvatarImage src={node.photoUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(node.firstName, node.lastName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-medium leading-tight">
          {node.firstName} {node.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {node.position?.title ?? 'Sin cargo'}
          {node.department?.name ? ` · ${node.department.name}` : ''}
        </p>
      </div>
      {node.children.length > 0 && (
        <span className="ml-2 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Users className="h-3 w-3" /> {node.children.length}
        </span>
      )}
    </button>
  );
}
