"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming sonner is installed for toasts

export default function DocumentDashboard() {
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [deleteFileName, setDeleteFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName, content }),
      });

      if (response.ok) {
        toast.success("Document added successfully!");
        setFileName("");
        setContent("");
      } else {
        const errorData = await response.json();
        toast.error(`Error adding document: ${errorData.error || response.statusText}`);
      }
    } catch (error: any) {
      toast.error(`Failed to add document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileNames: [deleteFileName] }),
      });

      if (response.ok) {
        toast.success("Document deleted successfully!");
        setDeleteFileName("");
      } else {
        const errorData = await response.json();
        toast.error(`Error deleting document: ${errorData.error || response.statusText}`);
      }
    } catch (error: any) {
      toast.error(`Failed to delete document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Pinecone Document Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., my-new-document.txt"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="content">Document Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your document content here..."
                  rows={10}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleAddDocument} disabled={loading || !fileName || !content}>
                {loading ? "Adding..." : "Add Document to Index"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deleteFileName">File Name to Delete</Label>
                <Input
                  id="deleteFileName"
                  value={deleteFileName}
                  onChange={(e) => setDeleteFileName(e.target.value)}
                  placeholder="e.g., my-old-document.txt"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleDeleteDocument} disabled={loading || !deleteFileName} variant="destructive">
                {loading ? "Deleting..." : "Delete Document from Index"}
              </Button>
              <p className="text-sm text-gray-500">
                Note: This will delete all chunks associated with the file name.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 