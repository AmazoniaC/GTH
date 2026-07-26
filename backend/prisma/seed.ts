import { PrismaClient, UserRole, Gender, EmployeeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos de demostración...');

  const passwordHash = await bcrypt.hash('Admin123*', 10);

  // Empresa demo
  const org = await prisma.organization.upsert({
    where: { nit: '900123456-7' },
    update: {},
    create: {
      name: 'Innova Talento S.A.S.',
      legalName: 'Innova Talento S.A.S.',
      nit: '900123456-7',
      city: 'Bogotá D.C.',
      address: 'Calle 100 # 15-20',
      phone: '+57 601 7000000',
      email: 'contacto@innovatalento.co',
    },
  });

  // Usuario administrador
  await prisma.user.upsert({
    where: { email: 'admin@innovatalento.co' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@innovatalento.co',
      password: passwordHash,
      firstName: 'Ana',
      lastName: 'Ramírez',
      role: UserRole.ADMIN,
    },
  });

  // Parámetros de nómina 2026
  await prisma.payrollConfig.upsert({
    where: { organizationId_year: { organizationId: org.id, year: 2026 } },
    update: {},
    create: {
      organizationId: org.id,
      year: 2026,
      minimumWage: 1_623_500,
      transportAllowance: 200_000,
      uvt: 49_799,
    },
  });

  // Departamentos
  const deptNames = ['Tecnología', 'Recursos Humanos', 'Finanzas', 'Comercial', 'Operaciones'];
  const departments = [];
  for (const name of deptNames) {
    const dept = await prisma.department.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { organizationId: org.id, name },
    });
    departments.push(dept);
  }

  // Cargos
  const positionsData = [
    { title: 'Desarrollador Senior', dept: 'Tecnología' },
    { title: 'Analista de RRHH', dept: 'Recursos Humanos' },
    { title: 'Contador', dept: 'Finanzas' },
    { title: 'Ejecutivo Comercial', dept: 'Comercial' },
    { title: 'Coordinador de Operaciones', dept: 'Operaciones' },
  ];
  const positions = [];
  let posCounter = 1;
  for (const p of positionsData) {
    const dept = departments.find((d) => d.name === p.dept)!;
    const code = `CAR-${String(posCounter).padStart(3, '0')}`;
    let pos = await prisma.position.findFirst({
      where: { organizationId: org.id, title: p.title },
    });
    if (!pos) {
      pos = await prisma.position.create({
        data: { organizationId: org.id, code, title: p.title, departmentId: dept.id },
      });
    } else if (!pos.code) {
      pos = await prisma.position.update({ where: { id: pos.id }, data: { code } });
    }
    positions.push(pos);
    posCounter += 1;
  }

  // Empleados con contratos
  const employeesData = [
    {
      firstName: 'Carlos',
      lastName: 'Gómez',
      doc: '1012345678',
      salary: 6_500_000,
      dept: 'Tecnología',
      pos: 'Desarrollador Senior',
      gender: Gender.MALE,
      arl: 1,
    },
    {
      firstName: 'María',
      lastName: 'Fernández',
      doc: '1023456789',
      salary: 3_200_000,
      dept: 'Recursos Humanos',
      pos: 'Analista de RRHH',
      gender: Gender.FEMALE,
      arl: 1,
    },
    {
      firstName: 'Julián',
      lastName: 'Torres',
      doc: '1034567890',
      salary: 4_100_000,
      dept: 'Finanzas',
      pos: 'Contador',
      gender: Gender.MALE,
      arl: 1,
    },
    {
      firstName: 'Laura',
      lastName: 'Martínez',
      doc: '1045678901',
      salary: 1_623_500,
      dept: 'Comercial',
      pos: 'Ejecutivo Comercial',
      gender: Gender.FEMALE,
      arl: 2,
    },
    {
      firstName: 'Andrés',
      lastName: 'Rojas',
      doc: '1056789012',
      salary: 2_800_000,
      dept: 'Operaciones',
      pos: 'Coordinador de Operaciones',
      gender: Gender.MALE,
      arl: 3,
    },
  ];

  let counter = 1;
  for (const e of employeesData) {
    const existing = await prisma.employee.findFirst({
      where: { organizationId: org.id, documentNumber: e.doc },
    });
    if (existing) continue;

    const dept = departments.find((d) => d.name === e.dept)!;
    const pos = positions.find((p) => p.title === e.pos)!;

    await prisma.employee.create({
      data: {
        organizationId: org.id,
        employeeCode: e.doc,
        documentType: 'CC',
        documentNumber: e.doc,
        firstName: e.firstName,
        lastName: e.lastName,
        email: `${e.firstName.toLowerCase()}.${e.lastName.toLowerCase()}@innovatalento.co`,
        gender: e.gender,
        city: 'Bogotá D.C.',
        hireDate: new Date(2023, 0, 15),
        status: EmployeeStatus.ACTIVE,
        departmentId: dept.id,
        positionId: pos.id,
        arlRiskClass: e.arl,
        eps: 'Sura EPS',
        pensionFund: 'Porvenir',
        severanceFund: 'Porvenir',
        compensationFund: 'Compensar',
        contracts: {
          create: {
            type: 'INDEFINITE',
            baseSalary: e.salary,
            startDate: new Date(2023, 0, 15),
            transportAllowance: e.salary <= 1_623_500 * 2,
            isActive: true,
          },
        },
      },
    });
    counter += 1;
  }

  console.log('✅ Datos sembrados.');
  console.log('   Empresa: Innova Talento S.A.S.');
  console.log('   Login:   admin@innovatalento.co / Admin123*');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
