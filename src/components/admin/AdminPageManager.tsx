import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface PageContent {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  published: boolean;
}

const AdminPageManager = () => {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [formData, setFormData] = useState<FormData>({
    slug: "",
    title: "",
    meta_description: "",
    content: "",
    published: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      toast.error("Failed to fetch pages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData({
      slug: "",
      title: "",
      meta_description: "",
      content: "",
      published: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (page: PageContent) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      meta_description: page.meta_description || "",
      content: page.content,
      published: page.published,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: formData.slug,
        title: formData.title,
        meta_description: formData.meta_description,
        content: formData.content,
        published: formData.published,
      };

      if (editingPage) {
        const { error } = await supabase
          .from("page_content")
          .update(payload)
          .eq("id", editingPage.id);
        
        if (error) throw error;
        toast.success("Page updated successfully");
      } else {
        const { error } = await supabase
          .from("page_content")
          .insert([payload]);
        
        if (error) throw error;
        toast.success("Page created successfully");
      }

      setIsDialogOpen(false);
      fetchPages();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("A page with this slug already exists");
      } else {
        toast.error("Failed to save page");
      }
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: PageContent) => {
    if (!confirm(`Are you sure you want to delete "${page.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("page_content")
        .delete()
        .eq("id", page.id);

      if (error) throw error;
      toast.success("Page deleted successfully");
      fetchPages();
    } catch (error) {
      toast.error("Failed to delete page");
      console.error(error);
    }
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Management</CardTitle>
          <CardDescription>
            Manage dynamic pages for your website. These pages can be accessed via their slug URLs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      /{page.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.published ? "default" : "secondary"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(page.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(page)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pages found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Edit Page" : "Create New Page"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingPage ? "update" : "create"} a page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Page title"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  placeholder="url-slug"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Page will be accessible at /{formData.slug}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Input
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) =>
                  setFormData({ ...formData, meta_description: e.target.value })
                }
                placeholder="Brief description for search engines (optional)"
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="HTML content for the page"
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-1">
                You can use HTML tags for formatting. Use &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
              <Label htmlFor="published">Published</Label>
              <p className="text-sm text-muted-foreground">
                Only published pages are visible to users
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingPage ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPageManager;