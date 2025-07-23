
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function PropertyListingsDashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 10) {
        alert("You can only upload a maximum of 10 files at a time.");
        e.target.value = ""; 
        setFiles([]);
        return;
      }
      setFiles(Array.from(e.target.files));
    }
  };

  const handleFileUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/apis/property-listings", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Files uploaded successfully!");
        setFiles([]);
      } else {
        alert("Error uploading files.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Property Listings Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload New Property Listing(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Property Listing Files (up to 10)</Label>
                <Input
                  id="file"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleFileUpload} disabled={loading || files.length === 0}>
                {loading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 