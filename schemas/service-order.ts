import { z } from 'zod';

export const serviceOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Informe o nome do cliente.'),
  phone: z.string().trim().min(10, 'Informe um telefone válido.'),
  document: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().min(2, 'Informe o modelo do aparelho.'),
  color: z.string().trim().optional(),
  imei: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  problemDescription: z.string().trim().min(5, 'Descreva o problema relatado.'),
  physicalCondition: z.string().trim().optional(),
  accessories: z.string().trim().optional(),
  technicianId: z.string().trim().optional(),
  estimatedValue: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  approvedValue: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional(),
  dueDate: z.string().trim().optional(),
  warrantyDays: z.coerce.number().int().min(0).max(3650),
  status: z.enum([
    'recebido',
    'analise',
    'orcamento_enviado',
    'aguardando_aprovacao',
    'em_execucao',
    'aguardando_peca',
    'testes',
    'pronto',
    'entregue',
    'cancelado'
  ])
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;
