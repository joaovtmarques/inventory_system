# Sistema de Controle de Estoque e Cautela

Sistema completo para gestão de equipamentos e controle de cautelas/empréstimos, desenvolvido com Next.js 13+ (App Router), TypeScript, TailwindCSS, shadcn/ui, Prisma e NextAuth.

## 🚀 Funcionalidades

### Autenticação e Autorização
- Sistema de login com email/senha
- 3 níveis de permissão: COMMON, ADMIN, SUPER_ADMIN
- Proteção de rotas baseada em roles

### Gestão de Equipamentos
- CRUD completo de equipamentos e categorias
- Controle de quantidade em estoque
- Gestão de números de série individuais
- Upload de imagens e documentos

### Sistema de Cautela
- Criação de cautelas com validação de estoque
- Controle automático de números de série
- Upload de documentos comprobatórios
- Geração automática de documentos .docx

### Relatórios
- Relatório diário "Gerar Pronto" (SUPER_ADMIN)
- Documentos de cautela individual
- Controle de devolução de equipamentos

## 🛠️ Tecnologias

- **Frontend**: Next.js 13+, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Validação**: Zod + React Hook Form
- **Geração de Documentos**: docxtemplater, pizzip

## 📦 Instalação

1. **Clone e instale dependências**:
```bash
npm install
```

2. **Configure o banco de dados**:
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

3. **Execute as migrações**:
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Execute o seed**:
```bash
npm run prisma:seed
```

5. **Inicie o projeto**:
```bash
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
UPLOAD_DIR="./public/uploads"
TEMP_DIR="./tmp"
```

### Usuário Inicial

Após executar o seed, você pode fazer login com:
- **Email**: admin@system.com
- **Senha**: admin123
- **Role**: SUPER_ADMIN

## 📋 Templates de Documentos

Para configurar os templates .docx:

1. Coloque os arquivos na pasta `public/templates/`:
   - `loan-equipments-form.docx` - Template para cautelas individuais
   - `loan-ready.docx` - Template para relatório diário

2. **Placeholders suportados** (use entre chaves `{}`):

### Template de Cautela (`loan-equipments-form.docx`):
- `{date}` - Data da cautela
- `{lender_name}` - Nome do responsável
- `{customer_name}` - Nome do cliente
- `{mission}` - Missão/destino
- `{observation}` - Observações
- `{total_price}` - Valor total

### Template de Relatório (`loan-ready.docx`):
- `{date}` - Data do relatório
- `{conference_date}` - Data para assinatura

## 🏗️ Estrutura do Projeto

```
├── app/
│   ├── (auth)/auth/          # Páginas de autenticação
│   ├── (app)/app/            # Área do usuário
│   ├── (app)/admin/          # Área administrativa
│   └── api/                  # API Routes
├── components/
│   ├── forms/                # Formulários reutilizáveis
│   ├── layout/               # Componentes de layout
│   ├── tables/               # Tabelas de dados
│   └── ui/                   # Componentes shadcn/ui
├── lib/                      # Utilitários e configurações
├── prisma/                   # Schema e migrações
└── types/                    # Tipos TypeScript
```

## 🔐 Permissões por Role

### COMMON
- Criar cautelas para si mesmo
- Visualizar suas próprias cautelas
- Visualizar equipamentos (somente leitura)

### ADMIN
- Todas as permissões de COMMON
- Gerenciar equipamentos e categorias
- Visualizar e gerenciar todas as cautelas
- Gerenciar usuários (exceto criar ADMIN/SUPER_ADMIN)

### SUPER_ADMIN
- Todas as permissões de ADMIN
- Criar outros administradores
- Gerar relatórios diários
- Acesso completo ao sistema

## 🎨 Customização Visual

O sistema usa CSS custom properties para fácil customização. Edite as variáveis em `app/globals.css`:

```css
:root {
  --primary: 210 100% 50%;        /* Cor primária */
  --secondary: 210 40% 96%;       /* Cor secundária */
  --accent: 210 40% 90%;          /* Cor de destaque */
  /* ... outras variáveis */
}
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run prisma:migrate` - Executa migrações do banco
- `npm run prisma:seed` - Popula banco com dados iniciais
- `npm run prisma:studio` - Abre interface visual do banco

## 🚀 Próximos Passos

1. Substitua os templates .docx pelos seus arquivos personalizados
2. Configure suas cores e fontes personalizadas
3. Ajuste as permissões conforme necessário
4. Configure integração com S3 para uploads (opcional)
5. Adicione testes automatizados

O sistema está pronto para uso em produção com todas as funcionalidades essenciais implementadas.