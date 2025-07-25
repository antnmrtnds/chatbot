"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  name: string;
  api_key: string;
  whitelisted_domains: string[];
  chatbot_config: any;
}

export default function WebsiteIntegrationDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch clients from the API
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/apis/clients'); // This API route needs to be created
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        toast.error('Failed to fetch clients.');
      }
    } catch (error) {
      toast.error('An error occurred while fetching clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchClients();
    setLoading(false); // Mocking API call for now
  }, []);

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Client name cannot be empty.");
      return;
    }
    // This will call a new API route to create the client
    toast.success(`Client "${newClientName}" would be created.`);
    const newClient: Client = {
      id: uuidv4(),
      name: newClientName,
      api_key: `api_key_${uuidv4()}`,
      whitelisted_domains: ['http://localhost:3000'],
      chatbot_config: { color: '#007bff' }
    };
    setClients([...clients, newClient]);
    setNewClientName('');
  };

  const handleUpdateDomains = (clientId: string, domains: string) => {
    // API call to update domains
    toast.info(`Updating domains for client ${clientId}`);
  };
  
  const handleRegenerateApiKey = (clientId: string) => {
    // API call to regenerate key
    toast.warning(`Regenerating API key for client ${clientId}`);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Website Integration Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Enter new client name"
            />
            <Button onClick={handleCreateClient}>Create Client</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <p>Loading clients...</p>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{client.name}</span>
                  <Button variant="destructive" size="sm">Delete</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="font-semibold">API Key</label>
                  <div className="flex items-center space-x-2">
                    <Input type="text" readOnly value={client.api_key} className="font-mono" />
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(client.api_key)}>Copy</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleRegenerateApiKey(client.id)}>Regenerate</Button>
                  </div>
                </div>
                <div>
                  <label className="font-semibold">Whitelisted Domains (comma-separated)</label>
                   <Input
                      type="text"
                      defaultValue={client.whitelisted_domains.join(', ')}
                      onBlur={(e) => handleUpdateDomains(client.id, e.target.value)}
                   />
                </div>
                <div>
                  <label className="font-semibold">Embed Script</label>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <pre className="text-sm font-mono overflow-x-auto">
                      <code>
                        {`<script src="https://your-app-domain.vercel.app/loader.js" async defer></script>\n<viriato-chatbot api-key="${client.api_key}"></viriato-chatbot>`}
                      </code>
                    </pre>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigator.clipboard.writeText(`<script src="https://your-app-domain.vercel.app/loader.js" async defer></script>\n<viriato-chatbot api-key="${client.api_key}"></viriato-chatbot>`)}
                  >
                    Copy Embed Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 