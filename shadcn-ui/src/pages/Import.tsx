import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, Smartphone, Cloud, Database,
  CheckCircle2, AlertCircle, Loader2, Download,
  MessageSquare, Users, Phone, Mail, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { contactsApi } from '@/lib/api/contacts';
import { messagesApi } from '@/lib/api/messages';
import { apiClient } from '@/lib/api/client';

interface ImportResult {
  contacts: number;
  messages: number;
  duplicates: number;
  errors: string[];
}

interface ParsedContact {
  name?: string;
  phone_number?: string;
  email?: string;
  organization?: string;
  tags?: string[];
  notes?: string;
}

interface ParsedMessage {
  body: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

export default function Import() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importType, setImportType] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);

  // Parse CSV file
  const parseCSV = (content: string): ParsedContact[] => {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length < 2) continue;

      const contact: ParsedContact = {};

      headers.forEach((header, idx) => {
        const value = values[idx];
        if (!value) return;

        if (header.includes('name') || header.includes('full')) {
          contact.name = value;
        } else if (header.includes('first')) {
          contact.name = value;
        } else if (header.includes('last') && contact.name) {
          contact.name += ' ' + value;
        } else if (header.includes('phone') || header.includes('mobile') || header.includes('cell')) {
          contact.phone_number = value.replace(/[^0-9+]/g, '');
        } else if (header.includes('email') || header.includes('mail')) {
          contact.email = value;
        } else if (header.includes('company') || header.includes('org')) {
          contact.organization = value;
        } else if (header.includes('note')) {
          contact.notes = value;
        }
      });

      if (contact.name || contact.phone_number || contact.email) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  // Parse vCard file
  const parseVCard = (content: string): ParsedContact[] => {
    const contacts: ParsedContact[] = [];
    const vcards = content.split('END:VCARD');

    for (const vcard of vcards) {
      if (!vcard.includes('BEGIN:VCARD')) continue;

      const contact: ParsedContact = {};
      const lines = vcard.split('\n');

      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (!value) continue;

        if (key.startsWith('FN')) {
          contact.name = value;
        } else if (key.startsWith('N') && !contact.name) {
          const parts = value.split(';');
          contact.name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
        } else if (key.startsWith('TEL')) {
          contact.phone_number = value.replace(/[^0-9+]/g, '');
        } else if (key.startsWith('EMAIL')) {
          contact.email = value;
        } else if (key.startsWith('ORG')) {
          contact.organization = value.split(';')[0];
        } else if (key.startsWith('NOTE')) {
          contact.notes = value;
        }
      }

      if (contact.name || contact.phone_number || contact.email) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  // Parse Google Contacts export (CSV format)
  const parseGoogleContacts = (content: string): ParsedContact[] => {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted values with commas
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!matches) continue;

      const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
      const contact: ParsedContact = {};

      headers.forEach((header, idx) => {
        const value = values[idx];
        if (!value) return;

        const h = header.toLowerCase();
        if (h === 'name' || h === 'given name') {
          contact.name = value;
        } else if (h === 'family name' && contact.name) {
          contact.name += ' ' + value;
        } else if (h.includes('phone')) {
          if (!contact.phone_number) contact.phone_number = value.replace(/[^0-9+]/g, '');
        } else if (h.includes('e-mail') || h === 'email') {
          if (!contact.email) contact.email = value;
        } else if (h === 'organization 1 - name') {
          contact.organization = value;
        } else if (h === 'notes') {
          contact.notes = value;
        }
      });

      if (contact.name || contact.phone_number || contact.email) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  // Parse iPhone SMS database (simplified - for exported XML/JSON)
  const parseiPhoneSMS = (content: string): { contacts: ParsedContact[], messages: ParsedMessage[] } => {
    const contacts: ParsedContact[] = [];
    const messages: ParsedMessage[] = [];
    const seenPhones = new Set<string>();

    try {
      // Try parsing as JSON first (exported format)
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        for (const item of data) {
          // Handle messages
          if (item.text || item.body || item.message) {
            const phone = item.address || item.phone || item.from || item.to;
            if (phone) {
              const cleanPhone = phone.replace(/[^0-9+]/g, '');
              messages.push({
                body: item.text || item.body || item.message,
                phone_number: cleanPhone,
                direction: item.is_from_me || item.direction === 'outbound' ? 'outbound' : 'inbound',
                timestamp: item.date || item.timestamp || new Date().toISOString(),
              });

              if (!seenPhones.has(cleanPhone)) {
                seenPhones.add(cleanPhone);
                contacts.push({
                  name: item.contact_name || item.name,
                  phone_number: cleanPhone,
                });
              }
            }
          }
          // Handle contacts
          else if (item.name || item.phone_number) {
            contacts.push({
              name: item.name,
              phone_number: item.phone_number?.replace(/[^0-9+]/g, ''),
              email: item.email,
              organization: item.organization,
            });
          }
        }
      }
    } catch {
      // Try XML format
      const phoneMatches = content.match(/<address>(.*?)<\/address>/gi) || [];
      const textMatches = content.match(/<text>(.*?)<\/text>/gi) || [];
      const dateMatches = content.match(/<date>(.*?)<\/date>/gi) || [];
      const typeMatches = content.match(/<type>(.*?)<\/type>/gi) || [];

      for (let i = 0; i < textMatches.length; i++) {
        const phone = phoneMatches[i]?.replace(/<\/?address>/gi, '') || '';
        const text = textMatches[i]?.replace(/<\/?text>/gi, '') || '';
        const date = dateMatches[i]?.replace(/<\/?date>/gi, '') || '';
        const type = typeMatches[i]?.replace(/<\/?type>/gi, '') || '';

        if (phone && text) {
          const cleanPhone = phone.replace(/[^0-9+]/g, '');
          messages.push({
            body: text,
            phone_number: cleanPhone,
            direction: type === '2' || type === 'sent' ? 'outbound' : 'inbound',
            timestamp: date || new Date().toISOString(),
          });

          if (!seenPhones.has(cleanPhone)) {
            seenPhones.add(cleanPhone);
            contacts.push({ phone_number: cleanPhone });
          }
        }
      }
    }

    return { contacts, messages };
  };

  // Import contacts to API
  const importContacts = async (contacts: ParsedContact[]): Promise<number> => {
    let imported = 0;
    const batchSize = 10;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (contact) => {
          try {
            await contactsApi.createContact({
              name: contact.name,
              phone_number: contact.phone_number,
              email: contact.email,
              organization: contact.organization,
              tags: contact.tags || [],
              notes: contact.notes,
            });
            imported++;
          } catch (e) {
            console.warn('Failed to import contact:', contact, e);
          }
        })
      );

      setProgress(Math.round(((i + batch.length) / contacts.length) * 50));
    }

    return imported;
  };

  // Import messages to API
  const importMessages = async (messages: ParsedMessage[]): Promise<number> => {
    let imported = 0;
    const batchSize = 20;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (msg) => {
          try {
            await messagesApi.createMessage({
              body: msg.body,
              channel: 'sms',
              direction: msg.direction,
            });
            imported++;
          } catch (e) {
            console.warn('Failed to import message:', msg, e);
          }
        })
      );

      setProgress(50 + Math.round(((i + batch.length) / messages.length) * 50));
    }

    return imported;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportType(type);
    setProgress(0);
    setResult(null);

    try {
      const content = await file.text();
      let contacts: ParsedContact[] = [];
      let messages: ParsedMessage[] = [];

      switch (type) {
        case 'csv':
          contacts = parseCSV(content);
          break;
        case 'vcard':
          contacts = parseVCard(content);
          break;
        case 'google':
          contacts = parseGoogleContacts(content);
          break;
        case 'iphone':
          const parsediPhone = parseiPhoneSMS(content);
          contacts = parsediPhone.contacts;
          messages = parsediPhone.messages;
          break;
        case 'telegram':
          const parsedTelegram = parseTelegramExport(content);
          contacts = parsedTelegram.contacts;
          messages = parsedTelegram.messages;
          break;
        default:
          // Try to auto-detect
          if (content.includes('BEGIN:VCARD')) {
            contacts = parseVCard(content);
          } else if (content.includes('"chats"') || content.includes('"messages"')) {
            const parsedAuto = parseTelegramExport(content);
            contacts = parsedAuto.contacts;
            messages = parsedAuto.messages;
          } else if (content.includes(',')) {
            contacts = parseCSV(content);
          }
      }

      const importedContacts = await importContacts(contacts);
      const importedMessages = messages.length > 0 ? await importMessages(messages) : 0;

      setResult({
        contacts: importedContacts,
        messages: importedMessages,
        duplicates: contacts.length - importedContacts,
        errors: [],
      });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast.success(`Imported ${importedContacts} contacts${importedMessages > 0 ? ` and ${importedMessages} messages` : ''}`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed. Please check the file format.');
      setResult({
        contacts: 0,
        messages: 0,
        duplicates: 0,
        errors: [(error as Error).message],
      });
    } finally {
      setImporting(false);
      setProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Import Telegram conversations via API
  const importTelegram = async () => {
    setImporting(true);
    setImportType('telegram');
    setProgress(0);
    setResult(null);

    try {
      // Fetch Telegram updates from our backend
      const { data } = await apiClient.get('/api/integrations/telegram/updates');
      const messages = data.messages || [];

      setProgress(20);

      // Extract unique contacts from Telegram messages
      const contacts: ParsedContact[] = [];
      const seenChats = new Set<string>();

      for (const msg of messages) {
        const chatId = String(msg.chat_id);
        if (!seenChats.has(chatId)) {
          seenChats.add(chatId);
          contacts.push({
            name: msg.from || msg.username || `Telegram User ${chatId}`,
            notes: `Telegram Chat ID: ${chatId}${msg.username ? `\nUsername: @${msg.username}` : ''}`,
            tags: ['telegram'],
          });
        }
      }

      setProgress(40);

      // Import contacts
      const importedContacts = await importContacts(contacts);
      setProgress(60);

      // Import messages
      let importedMessages = 0;
      for (const msg of messages) {
        try {
          await messagesApi.createMessage({
            body: msg.text || '[Media message]',
            channel: 'telegram',
            direction: 'inbound',
          });
          importedMessages++;
        } catch (e) {
          console.warn('Failed to import Telegram message:', e);
        }
        setProgress(60 + Math.round((importedMessages / messages.length) * 40));
      }

      setResult({
        contacts: importedContacts,
        messages: importedMessages,
        duplicates: contacts.length - importedContacts,
        errors: [],
      });

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast.success(`Imported ${importedContacts} Telegram contacts and ${importedMessages} messages`);
    } catch (error) {
      console.error('Telegram import failed:', error);
      toast.error((error as Error).message || 'Failed to import from Telegram');
      setResult({
        contacts: 0,
        messages: 0,
        duplicates: 0,
        errors: [(error as Error).message],
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  // Parse Telegram Desktop export (JSON format)
  const parseTelegramExport = (content: string): { contacts: ParsedContact[], messages: ParsedMessage[] } => {
    const contacts: ParsedContact[] = [];
    const messages: ParsedMessage[] = [];
    const seenChats = new Set<string>();

    try {
      const data = JSON.parse(content);

      // Telegram Desktop exports have a "chats" array
      const chats = data.chats?.list || data.chats || [];

      for (const chat of chats) {
        const chatName = chat.name || chat.title || 'Unknown';
        const chatId = chat.id || chatName;

        if (!seenChats.has(chatId)) {
          seenChats.add(chatId);
          contacts.push({
            name: chatName,
            phone_number: chat.phone_number?.replace(/[^0-9+]/g, ''),
            notes: `Telegram${chat.username ? ` @${chat.username}` : ''}`,
            tags: ['telegram'],
          });
        }

        // Get messages from this chat
        const chatMessages = chat.messages || [];
        for (const msg of chatMessages) {
          if (msg.text || msg.text_entities) {
            let text = msg.text;
            if (typeof text === 'object' && Array.isArray(msg.text_entities)) {
              text = msg.text_entities.map((e: any) => e.text || '').join('');
            }
            if (typeof text !== 'string') {
              text = Array.isArray(text) ? text.map((t: any) => typeof t === 'string' ? t : t.text || '').join('') : String(text);
            }

            messages.push({
              body: text,
              phone_number: chat.phone_number || chatId,
              direction: msg.from === 'You' || msg.from_id === 'user' + data.personal_information?.user_id ? 'outbound' : 'inbound',
              timestamp: msg.date || new Date().toISOString(),
            });
          }
        }
      }

      // Also handle "messages" at root level (some exports)
      if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          if (msg.text) {
            messages.push({
              body: typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text),
              phone_number: msg.from_id || msg.chat_id || 'unknown',
              direction: msg.out || msg.from === 'You' ? 'outbound' : 'inbound',
              timestamp: msg.date || new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse Telegram export:', e);
    }

    return { contacts, messages };
  };

  const importSources = [
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      description: 'Import conversations from Telegram (live or export)',
      accepts: '.json',
      color: 'from-blue-400 to-blue-600',
      instructions: [
        '1. Click "Sync from Telegram" to pull live conversations',
        '2. Or export from Telegram Desktop: Settings > Advanced > Export',
        '3. Upload the result.json file',
      ],
      hasLiveSync: true,
    },
    {
      id: 'iphone',
      name: 'iPhone / iMessage',
      icon: Smartphone,
      description: 'Import contacts and SMS from iPhone backup or export',
      accepts: '.json,.xml,.csv',
      color: 'from-gray-600 to-gray-800',
      instructions: [
        '1. Use an app like "iMazing" or "AnyTrans" to export your messages',
        '2. Export as JSON or XML format',
        '3. Upload the exported file here',
      ],
    },
    {
      id: 'csv',
      name: 'CSV / Excel',
      icon: FileText,
      description: 'Import from spreadsheet with columns: name, phone, email',
      accepts: '.csv,.txt',
      color: 'from-green-600 to-green-800',
      instructions: [
        '1. Export your contacts to CSV from any app',
        '2. Include columns: name, phone, email, organization',
        '3. Upload the CSV file',
      ],
    },
    {
      id: 'vcard',
      name: 'vCard (.vcf)',
      icon: Users,
      description: 'Standard contact format from iOS, Android, Outlook',
      accepts: '.vcf,.vcard',
      color: 'from-blue-600 to-blue-800',
      instructions: [
        '1. On iPhone: Settings > Contacts > Export vCard',
        '2. On Android: Contacts > Export > Share as .vcf',
        '3. Upload the .vcf file',
      ],
    },
    {
      id: 'google',
      name: 'Google Contacts',
      icon: Cloud,
      description: 'Export from contacts.google.com',
      accepts: '.csv',
      color: 'from-red-500 to-yellow-500',
      instructions: [
        '1. Go to contacts.google.com',
        '2. Click Export > Google CSV',
        '3. Upload the exported file',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Import Data</h1>
        <p className="text-muted-foreground mt-1">
          Import your contacts and messages from various sources
        </p>
      </div>

      {/* Import Progress */}
      {importing && (
        <Card className="glass-panel border-primary/50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="font-medium">Importing {importType}...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your data
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {result && !importing && (
        <Card className={`glass-panel ${result.errors.length > 0 ? 'border-destructive/50' : 'border-green-500/50'}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4 mb-4">
              {result.errors.length > 0 ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              <div>
                <p className="font-medium">
                  {result.errors.length > 0 ? 'Import completed with errors' : 'Import successful!'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{result.contacts}</p>
                <p className="text-xs text-muted-foreground">Contacts Imported</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{result.messages}</p>
                <p className="text-xs text-muted-foreground">Messages Imported</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <Database className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-2xl font-bold">{result.duplicates}</p>
                <p className="text-xs text-muted-foreground">Duplicates Skipped</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                <p className="text-2xl font-bold">{result.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {importSources.map((source) => {
          const Icon = source.icon;
          return (
            <Card key={source.id} className="glass-panel overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${source.color}`} />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${source.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <CardDescription>{source.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  {source.instructions.map((instruction, idx) => (
                    <p key={idx}>{instruction}</p>
                  ))}
                </div>
                <input
                  ref={source.id === importType ? fileInputRef : undefined}
                  type="file"
                  accept={source.accepts}
                  onChange={(e) => handleFileUpload(e, source.id)}
                  className="hidden"
                  id={`file-${source.id}`}
                  disabled={importing}
                />
                {(source as any).hasLiveSync && (
                  <Button
                    onClick={importTelegram}
                    disabled={importing}
                    className="w-full mb-2 bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Sync from Telegram (Live)
                  </Button>
                )}
                <Button
                  onClick={() => document.getElementById(`file-${source.id}`)?.click()}
                  disabled={importing}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {(source as any).hasLiveSync ? 'Or Upload Export File' : 'Select File'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Export Guide */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            How to Export Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="iphone" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="iphone">iPhone</TabsTrigger>
              <TabsTrigger value="android">Android</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="outlook">Outlook</TabsTrigger>
            </TabsList>
            <TabsContent value="iphone" className="mt-4 space-y-3">
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Export Contacts
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open Settings on your iPhone</li>
                  <li>Go to your Apple ID {">"} iCloud {">"} Contacts</li>
                  <li>Use icloud.com to export all contacts as vCard</li>
                  <li>Or use the Contacts app and share selected contacts</li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Export Messages
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Use iMazing (free trial) or AnyTrans</li>
                  <li>Connect iPhone to computer</li>
                  <li>Navigate to Messages section</li>
                  <li>Export as JSON or CSV format</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="android" className="mt-4 space-y-3">
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Export Contacts
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open Contacts app</li>
                  <li>Tap menu {">"} Settings {">"} Export</li>
                  <li>Choose "Export to .vcf file"</li>
                  <li>Save and upload the file here</li>
                </ol>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Export Messages
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Install "SMS Backup & Restore" from Play Store</li>
                  <li>Run a backup</li>
                  <li>Export to XML or JSON format</li>
                  <li>Upload the backup file here</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="google" className="mt-4 space-y-3">
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Export from Google Contacts
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to contacts.google.com</li>
                  <li>Click the menu icon (three lines)</li>
                  <li>Select "Export"</li>
                  <li>Choose "Google CSV" format</li>
                  <li>Click Export and upload the file here</li>
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="outlook" className="mt-4 space-y-3">
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Export from Outlook
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open Outlook</li>
                  <li>Go to File {">"} Open & Export {">"} Import/Export</li>
                  <li>Select "Export to a file"</li>
                  <li>Choose "Comma Separated Values"</li>
                  <li>Select Contacts folder and export</li>
                  <li>Upload the CSV file here</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
