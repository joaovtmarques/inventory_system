import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const EquipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  amount: z.number().int().min(0, "Quantidade deve ser maior ou igual a 0"),
  unitPrice: z.number().min(0, "Preço deve ser maior ou igual a 0"),
  condition: z.enum(["NOVO", "BOM", "REGULAR", "RUIM"]),
  observation: z.string().optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

export const LoanSchema = z.object({
  customerId: z.string().nonempty(),
  equipments: z.array(
    z.object({
      equipmentId: z.string().nonempty(),
      quantity: z.number().int().min(1),
      serialNumbers: z.array(z.string()).optional(),
    })
  ),
  devolutionDate: z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().optional()
  ),
  observation: z.string().optional(),
  mission: z.string().optional(),
  type: z.enum(["CAUTELA", "EMPRESTIMO_TEMPORARIO"]),
  urgency: z.string().optional(),
});

export const CustomerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
  rank: z.string().min(2, "Posto/Graduação é obrigatório"),
  warName: z.string().min(2, "Nome de guerra é obrigatório"),
  militaryOrganization: z.string().min(4, "Organização militar é obrigatória"),
  document: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .regex(/^\d+$/, "CPF deve conter apenas números"),
});

export const SerialNumberSchema = z.object({
  equipmentId: z.string(),
  number: z.string().min(1, "Número de série é obrigatório"),
  status: z.enum(["EM_ESTOQUE", "CAUTELADO", "MANUTENCAO", "BAIXADO"]),
  condition: z.enum(["NOVO", "BOM", "REGULAR", "RUIM"]),
  observation: z.string().optional(),
});

export const EquipmentAlterationSchema = z.object({
  desc: z.string().min(1, "Descrição é obrigatória"),
  mission: z.string().min(1, "Missão é obrigatória"),
  location: z.string().min(1, "Local é obrigatório"),
  date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  loanId: z.string().optional().nullable(),
  customerId: z.string().min(1, "Cliente é obrigatório"),
  equipment: z.string().min(2, "Equipamento é obrigatório"),
  serialNumber: z.array(z.string().min(1, "Número de série é obrigatório")),
  amount: z.string().min(1, "Quantidade é obrigatória"),
});
