import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Mail, Phone, Tag } from 'lucide-react';
import { contactsApi } from '@/lib/api/contacts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatRelativeTime } from '@/lib/utils/date';
import { toast } from 'sonner';

export default function Contacts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone_number: '',
    email: '',
    organization: '',
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: () => contactsApi.getContacts({ search: searchQuery, limit: 100 }),
  });

  const createContactMutation = useMutation({
    mutationFn: contactsApi.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsDialogOpen(false);
      setNewContact({ name: '', phone_number: '', email: '', organization: '' });
      toast.success('Contact created successfully');
    },
    onError: () => {
      toast.error('Failed to create contact');
    },
  });

  const handleCreateContact = () => {
    if (!newContact.name && !newContact.phone_number) {
      toast.error('Please provide at least a name or phone number');
      return;
    }
    createContactMutation.mutate(newContact);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your contacts with AI-powered insights
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel">
            <DialogHeader>
              <DialogTitle>Create New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newContact.phone_number}
                  onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={newContact.organization}
                  onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <Button
                onClick={handleCreateContact}
                disabled={createContactMutation.isPending}
                className="w-full gradient-primary"
              >
                {createContactMutation.isPending ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <Card className="glass-panel p-12">
          <div className="text-center">
            <img
              src="/images/NoContacts.jpg"
              alt="No contacts"
              className="w-48 h-48 mx-auto mb-6 opacity-50"
            />
            <h3 className="text-xl font-bold mb-2">No contacts yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first contact or let AI extract them from messages
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="glass-panel p-6 hover:scale-105 transition-transform">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">
                    {contact.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">
                    {contact.name || 'Unknown'}
                  </h3>
                  {contact.organization && (
                    <p className="text-sm text-muted-foreground mb-2">{contact.organization}</p>
                  )}
                  <div className="space-y-1 mb-3">
                    {contact.phone_number && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{contact.phone_number}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {contact.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {contact.last_interaction_at && (
                    <p className="text-xs text-muted-foreground">
                      Last contact: {formatRelativeTime(contact.last_interaction_at)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}