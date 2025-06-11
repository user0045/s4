
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Content {
  id: string;
  title: string;
  type: "Movie" | "TV Show";
  genres: string[];
  duration: string;
  rating: string;
  numerical_rating?: number;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  trailer_url?: string;
  release_year?: number;
  director?: string;
  writer?: string;
  cast?: string[];
  home_hero?: boolean;
  type_page_hero?: boolean;
  home_new_release?: boolean;
  type_page_new_release?: boolean;
  home_popular?: boolean;
  type_page_popular?: boolean;
}

interface ContentEditFormProps {
  contentId: string;
  onCancel: () => void;
  onSave: () => void;
}

const ContentEditForm = ({ contentId, onCancel, onSave }: ContentEditFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCastMember, setNewCastMember] = useState("");
  const [newGenre, setNewGenre] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load content",
          variant: "destructive"
        });
        return;
      }

      // Cast the type field to ensure it matches our Content interface
      const typedData = {
        ...data,
        type: data.type as "Movie" | "TV Show",
        genres: Array.isArray(data.genres) ? data.genres : (data.genre ? [data.genre] : []),
        cast: Array.isArray(data.cast) ? data.cast : []
      };

      setFormData(typedData);
      setIsLoading(false);
    };

    fetchContent();
  }, [contentId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const { error } = await supabase
      .from('content')
      .update({
        title: formData.title,
        type: formData.type,
        genres: formData.genres,
        duration: formData.duration,
        rating: formData.rating,
        numerical_rating: formData.numerical_rating,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        video_url: formData.video_url,
        trailer_url: formData.trailer_url,
        release_year: formData.release_year,
        director: formData.director,
        writer: formData.writer,
        cast: formData.cast,
        home_hero: formData.home_hero,
        type_page_hero: formData.type_page_hero,
        home_new_release: formData.home_new_release,
        type_page_new_release: formData.type_page_new_release,
        home_popular: formData.home_popular,
        type_page_popular: formData.type_page_popular,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Content updated successfully!"
    });
    
    onSave();
  };

  const handleInputChange = (field: keyof Content, value: string | number | boolean | string[]) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const addCastMember = () => {
    if (newCastMember.trim() && formData && !formData.cast?.includes(newCastMember.trim())) {
      setFormData({
        ...formData,
        cast: [...(formData.cast || []), newCastMember.trim()]
      });
      setNewCastMember("");
    }
  };

  const removeCastMember = (memberToRemove: string) => {
    if (formData) {
      setFormData({
        ...formData,
        cast: formData.cast?.filter(member => member !== memberToRemove) || []
      });
    }
  };

  const addGenre = () => {
    if (newGenre.trim() && formData && !formData.genres.includes(newGenre.trim())) {
      setFormData({
        ...formData,
        genres: [...formData.genres, newGenre.trim()]
      });
      setNewGenre("");
    }
  };

  const removeGenre = (genreToRemove: string) => {
    if (formData) {
      setFormData({
        ...formData,
        genres: formData.genres.filter(genre => genre !== genreToRemove)
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!formData) {
    return <div>Content not found</div>;
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground">Edit Content</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "Movie" | "TV Show") => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Movie">Movie</SelectItem>
                  <SelectItem value="TV Show">TV Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Genres</Label>
              <div className="flex gap-2 mb-2">
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value && !formData.genres.includes(value)) {
                      setFormData({
                        ...formData,
                        genres: [...formData.genres, value]
                      });
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Action">Action</SelectItem>
                    <SelectItem value="Adventure">Adventure</SelectItem>
                    <SelectItem value="Animation">Animation</SelectItem>
                    <SelectItem value="Biography">Biography</SelectItem>
                    <SelectItem value="Comedy">Comedy</SelectItem>
                    <SelectItem value="Crime">Crime</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                    <SelectItem value="Drama">Drama</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Horror">Horror</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Musical">Musical</SelectItem>
                    <SelectItem value="Mystery">Mystery</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                    <SelectItem value="Sport">Sport</SelectItem>
                    <SelectItem value="Thriller">Thriller</SelectItem>
                    <SelectItem value="War">War</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder="Or add custom genre"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGenre();
                    }
                  }}
                />
                <Button type="button" onClick={addGenre} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.genres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                    {genre}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeGenre(genre)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rating">Rating Type</Label>
              <Select
                value={formData.rating}
                onValueChange={(value) => handleInputChange("rating", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="PG">PG</SelectItem>
                  <SelectItem value="PG-13">PG-13</SelectItem>
                  <SelectItem value="R">R</SelectItem>
                  <SelectItem value="NC-17">NC-17</SelectItem>
                  <SelectItem value="TV-Y">TV-Y</SelectItem>
                  <SelectItem value="TV-Y7">TV-Y7</SelectItem>
                  <SelectItem value="TV-G">TV-G</SelectItem>
                  <SelectItem value="TV-PG">TV-PG</SelectItem>
                  <SelectItem value="TV-14">TV-14</SelectItem>
                  <SelectItem value="TV-MA">TV-MA</SelectItem>
                  <SelectItem value="Not Rated">Not Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numerical_rating">Numerical Rating (0.0 - 10.0)</Label>
              <Input
                id="numerical_rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.numerical_rating || ""}
                onChange={(e) => handleInputChange("numerical_rating", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            

            <div className="space-y-2">
              <Label htmlFor="release_year">Release Year</Label>
              <Input
                id="release_year"
                type="number"
                value={formData.release_year || ""}
                onChange={(e) => handleInputChange("release_year", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="director">Director</Label>
              <Input
                id="director"
                value={formData.director || ""}
                onChange={(e) => handleInputChange("director", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="writer">Writer</Label>
              <Input
                id="writer"
                value={formData.writer || ""}
                onChange={(e) => handleInputChange("writer", e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Cast</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newCastMember}
                onChange={(e) => setNewCastMember(e.target.value)}
                placeholder="Add cast member"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCastMember())}
              />
              <Button type="button" onClick={addCastMember} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.cast?.map((member) => (
                <Badge key={member} variant="secondary" className="flex items-center gap-1">
                  {member}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeCastMember(member)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                type="url"
                value={formData.thumbnail_url || ""}
                onChange={(e) => handleInputChange("thumbnail_url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url || ""}
                onChange={(e) => handleInputChange("video_url", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trailer_url">Trailer URL</Label>
              <Input
                id="trailer_url"
                type="url"
                value={formData.trailer_url || ""}
                onChange={(e) => handleInputChange("trailer_url", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Feature Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Home Page Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home_hero"
                      checked={formData.home_hero || false}
                      onCheckedChange={(checked) => handleInputChange("home_hero", checked as boolean)}
                    />
                    <Label htmlFor="home_hero" className="text-sm">Home Hero</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home_new_release"
                      checked={formData.home_new_release || false}
                      onCheckedChange={(checked) => handleInputChange("home_new_release", checked as boolean)}
                    />
                    <Label htmlFor="home_new_release" className="text-sm">Home New Release</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="home_popular"
                      checked={formData.home_popular || false}
                      onCheckedChange={(checked) => handleInputChange("home_popular", checked as boolean)}
                    />
                    <Label htmlFor="home_popular" className="text-sm">Home Popular</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">{formData.type === "Movie" ? "Movies" : "TV Shows"} Page Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type_page_hero"
                      checked={formData.type_page_hero || false}
                      onCheckedChange={(checked) => handleInputChange("type_page_hero", checked as boolean)}
                    />
                    <Label htmlFor="type_page_hero" className="text-sm">{formData.type === "Movie" ? "Movies" : "TV Shows"} Hero</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type_page_new_release"
                      checked={formData.type_page_new_release || false}
                      onCheckedChange={(checked) => handleInputChange("type_page_new_release", checked as boolean)}
                    />
                    <Label htmlFor="type_page_new_release" className="text-sm">{formData.type === "Movie" ? "Movies" : "TV Shows"} New Release</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="type_page_popular"
                      checked={formData.type_page_popular || false}
                      onCheckedChange={(checked) => handleInputChange("type_page_popular", checked as boolean)}
                    />
                    <Label htmlFor="type_page_popular" className="text-sm">{formData.type === "Movie" ? "Movies" : "TV Shows"} Popular</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContentEditForm;
