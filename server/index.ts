// Silence libsignal's noisy console logs (e.g., "Closing session: SessionEntry", "Opening session")
const originalConsoleInfo = console.info;
console.info = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Closing session:') ||
     args[0].includes('Opening session:') ||
     args[0].includes('Removing old closed session:'))
  ) {
    return;
  }
  originalConsoleInfo.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Session already closed') ||
     args[0].includes('Session already open'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import next from 'next';
import { parse } from 'url';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { whatsappService } from './services/whatsapp';
import { campaignService } from './services/campaign';
import { setupSockets } from './sockets';
import { parseCSV } from './utils/csv';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';

// Em desenvolvimento, rodamos de forma standalone para que 'next dev' rode na porta 3000 de forma independente
const shouldIntegrateNext = process.env.NODE_ENV === 'production' || process.env.INTEGRATE_NEXT === 'true';

const startServer = (app: express.Express) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors());
  app.use(express.json());

  // Configurar multer para upload de arquivos
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos CSV são permitidos'));
      }
    },
  });

  // Endpoint para upload de CSV
  app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
      }

      const filePath = req.file.path;
      const contacts = await parseCSV(filePath);

      // Limpar arquivo após processar
      fs.unlink(filePath, (err) => {
        if (err) console.error('Erro ao deletar arquivo temporário:', err);
      });

      if (contacts.length === 0) {
        return res.status(400).json({ error: 'Nenhum contato válido encontrado no arquivo CSV' });
      }

      res.json({
        success: true,
        contacts,
        message: `${contacts.length} contatos importados com sucesso`,
      });
    } catch (error) {
      // Limpar arquivo em caso de erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao deletar arquivo temporário:', err);
        });
      }
      res.status(500).json({ error: 'Erro ao processar arquivo CSV: ' + (error as Error).message });
    }
  });

  // Rotas de autenticação
  app.use('/api/auth', authRouter);
  
  // Rotas de admin
  app.use('/api/admin', adminRouter);

  setupSockets(io);

  const PORT = process.env.PORT || 3001;

  httpServer.listen(PORT, async () => {
    console.log(`> Servidor Backend ${shouldIntegrateNext ? 'Fullstack' : 'Standalone'} rodando na porta ${PORT}`);
    try {
      await whatsappService.init();
      console.log('WhatsApp Service inicializado');
      
      // Retomar campanhas agendadas pendentes do Supabase
      await campaignService.resumeScheduledCampaigns();
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp Service:', error);
    }
  });
};

const app = express();

if (shouldIntegrateNext) {
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    // Serve backend API routes if any, before the catch-all
    // app.use('/api', backendRouter);

    app.all('(.*)', (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    startServer(app);
  });
} else {
  // Rota de boas-vindas simples para o modo de desenvolvimento standalone
  app.get('/', (req, res) => {
    res.send('API Backend (Dev Mode) rodando na porta 3001. Acesse o Frontend em http://localhost:3000');
  });

  startServer(app);
}
