import { z } from 'zod';

export const serviceOrderSchema = z.object({
  customerName: z.string().min(3, 'Informe o nome do cliente.'),
  phone: z.string().min(10, 'Informe um telefone válido.'),
  device: z.string().min(2, 'Informe o modelo do aparelho.'),
  imei: z.string().optional(),
  issue: z.string().min(5, 'Descreva o problema relatado.'),
  technician: z.string().min(2, 'Informe o técnico responsável.'),
  amount: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  dueDate: z.string().min(1, 'Informe a previsão de entrega.')
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;
