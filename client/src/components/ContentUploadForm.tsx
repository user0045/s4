import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Save, Plus, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Season {
  seasonNumber: number;
  description: string;
  releaseYear: number;
  ratingType: string;
  rating: number;
  director: string;
  writer: string;
  cast: string[];
  thumbnailUrl: string;
  trailerUrl: string;
  homeHero: boolean;
  typePageHero: boolean;
  homeNewRelease: boolean;
  typePageNewRelease: boolean;
  homePopular: boolean;
  typePagePopular: boolean;
  episodes: Episode[];
}

interface Episode {
  episodeNumber: number;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
}

const ContentUploadForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    type: "movie",
    genres: [] as string[],
    description: "",
    releaseYear: new Date().getFullYear(),
    ratingType: "",
    rating: 0.0,
    director: "",
    writer: "",
    cast: [] as string[],
    thumbnailUrl: "",
    trailerUrl: "",
    videoUrl: "", // Only for movies
    // Feature flags
    homeHero: false,
    typePageHero: false,
    homeNewRelease: false,
    typePageNewRelease: false,
    homePopular: false,
    typePagePopular: false,
  });

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [newGenre, setNewGenre] = useState("");
  const [newCastMember, setNewCastMember] = useState("");

  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      // For movies, insert directly into content table
      if (data.type === "movie") {
        const { data: contentData, error } = await supabase
          .from('content')
          .insert({
            title: data.title,
            type: 'Movie', // Use exact database constraint value
            genre: data.genres[0] || '', // Use first genre for compatibility
            duration: '120 min', // Default duration
            rating: data.ratingType,
            status: 'Published',
            views: '0',
            description: data.description,
            release_year: data.releaseYear,
            thumbnail_url: data.thumbnailUrl,
            video_url: data.videoUrl,
            trailer_url: data.trailerUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return contentData;
      } else {
        // For TV shows, we'll just insert basic info for now
        const { data: contentData, error } = await supabase
          .from('content')
          .insert({
            title: data.title,
            type: 'TV Show', // This is already correct
            genre: data.genres[0] || '',
            duration: 'Variable',
            rating: data.seasons?.[0]?.ratingType || 'Not Rated',
            status: 'Published',
            views: '0',
            description: data.seasons?.[0]?.description || data.description,
            release_year: data.seasons?.[0]?.releaseYear || data.releaseYear,
            thumbnail_url: data.seasons?.[0]?.thumbnailUrl || data.thumbnailUrl,
            trailer_url: data.seasons?.[0]?.trailerUrl || data.trailerUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return contentData;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast({
        title: "Success",
        description: "Content created successfully!"
      });
      // Reset form
      setFormData({
        title: "",
        type: "movie",
        genres: [],
        description: "",
        releaseYear: new Date().getFullYear(),
        ratingType: "",
        rating: 0.0,
        director: "",
        writer: "",
        cast: [],
        thumbnailUrl: "",
        trailerUrl: "",
        videoUrl: "",
        homeHero: false,
        typePageHero: false,
        homeNewRelease: false,
        typePageNewRelease: false,
        homePopular: false,
        typePagePopular: false,
      });
      setSeasons([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create content",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGenre = () => {
    if (newGenre.trim() && !formData.genres.includes(newGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, newGenre.trim()]
      }));
      setNewGenre("");
    }
  };

  const removeGenre = (genreToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(genre => genre !== genreToRemove)
    }));
  };

  const addCastMember = () => {
    if (newCastMember.trim() && !formData.cast.includes(newCastMember.trim())) {
      setFormData(prev => ({
        ...prev,
        cast: [...prev.cast, newCastMember.trim()]
      }));
      setNewCastMember("");
    }
  };

  const removeCastMember = (memberToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.filter(member => member !== memberToRemove)
    }));
  };

  // Season management
  const addSeason = () => {
    const newSeason: Season = {
      seasonNumber: seasons.length + 1,
      description: "",
      releaseYear: new Date().getFullYear(),
      ratingType: "",
      rating: 0.0,
      director: "",
      writer: "",
      cast: [],
      thumbnailUrl: "",
      trailerUrl: "",
      homeHero: false,
      typePageHero: false,
      homeNewRelease: false,
      typePageNewRelease: false,
      homePopular: false,
      typePagePopular: false,
      episodes: [],
    };
    setSeasons(prev => [...prev, newSeason]);
  };

  const updateSeason = (seasonIndex: number, field: string, value: any) => {
    setSeasons(prev => prev.map((season, index) => 
      index === seasonIndex ? { ...season, [field]: value } : season
    ));
  };

  const removeSeason = (seasonIndex: number) => {
    setSeasons(prev => prev.filter((_, index) => index !== seasonIndex));
  };

  const addSeasonCastMember = (seasonIndex: number, member: string) => {
    if (member.trim()) {
      setSeasons(prev => prev.map((season, index) => 
        index === seasonIndex ? { 
          ...season, 
          cast: [...season.cast, member.trim()] 
        } : season
      ));
    }
  };

  const removeSeasonCastMember = (seasonIndex: number, memberToRemove: string) => {
    setSeasons(prev => prev.map((season, index) => 
      index === seasonIndex ? { 
        ...season, 
        cast: season.cast.filter(member => member !== memberToRemove) 
      } : season
    ));
  };

  // Episode management
  const addEpisode = (seasonIndex: number) => {
    const newEpisode: Episode = {
      episodeNumber: seasons[seasonIndex].episodes.length + 1,
      title: "",
      description: "",
      duration: "",
      videoUrl: "",
      thumbnailUrl: "",
    };
    setSeasons(prev => prev.map((season, index) => 
      index === seasonIndex ? { 
        ...season, 
        episodes: [...season.episodes, newEpisode] 
      } : season
    ));
  };

  const updateEpisode = (seasonIndex: number, episodeIndex: number, field: string, value: any) => {
    setSeasons(prev => prev.map((season, sIndex) => 
      sIndex === seasonIndex ? {
        ...season,
        episodes: season.episodes.map((episode, eIndex) => 
          eIndex === episodeIndex ? { ...episode, [field]: value } : episode
        )
      } : season
    ));
  };

  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    setSeasons(prev => prev.map((season, sIndex) => 
      sIndex === seasonIndex ? {
        ...season,
        episodes: season.episodes.filter((_, eIndex) => eIndex !== episodeIndex)
      } : season
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.genres.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one genre",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === "tv_show" && seasons.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one season for TV shows",
        variant: "destructive"
      });
      return;
    }

    const data = {
      title: formData.title,
      type: formData.type,
      genres: formData.genres,
      description: formData.description || null,
      releaseYear: formData.releaseYear,
      ratingType: formData.ratingType,
      rating: formData.rating,
      director: formData.director || null,
      writer: formData.writer || null,
      cast: formData.cast.length > 0 ? formData.cast : null,
      thumbnailUrl: formData.thumbnailUrl || null,
      trailerUrl: formData.trailerUrl || null,
      videoUrl: formData.type === "movie" ? formData.videoUrl || null : null,
      homeHero: formData.homeHero,
      typePageHero: formData.typePageHero,
      homeNewRelease: formData.homeNewRelease,
      typePageNewRelease: formData.typePageNewRelease,
      homePopular: formData.homePopular,
      typePagePopular: formData.typePagePopular,
      seasons: formData.type === "tv_show" ? seasons : null,
    };

    createContentMutation.mutate(data);
  };

  const renderFeatureCheckboxes = (prefix = "", seasonIndex?: number) => {
    const isMovie = formData.type === "movie";
    const movieLabel = isMovie ? "Movies" : "TV Shows";

    const getValue = (field: string) => {
      if (seasonIndex !== undefined) {
        return seasons[seasonIndex]?.[field as keyof Season] as boolean;
      }
      return formData[field as keyof typeof formData] as boolean;
    };

    const setValue = (field: string, value: boolean) => {
      if (seasonIndex !== undefined) {
        updateSeason(seasonIndex, field, value);
      } else {
        handleInputChange(field, value);
      }
    };

    return (
      <div className="space-y-2">
        <Label>{prefix}Feature In</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}homeHero`}
              checked={getValue("homeHero")}
              onCheckedChange={(checked) => setValue("homeHero", !!checked)}
            />
            <Label htmlFor={`${prefix}homeHero`} className="text-sm">Home Page Hero Slider</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}typePageHero`}
              checked={getValue("typePageHero")}
              onCheckedChange={(checked) => setValue("typePageHero", !!checked)}
            />
            <Label htmlFor={`${prefix}typePageHero`} className="text-sm">{movieLabel} Page Hero Slider</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}homeNewRelease`}
              checked={getValue("homeNewRelease")}
              onCheckedChange={(checked) => setValue("homeNewRelease", !!checked)}
            />
            <Label htmlFor={`${prefix}homeNewRelease`} className="text-sm">Home New Release</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}typePageNewRelease`}
              checked={getValue("typePageNewRelease")}
              onCheckedChange={(checked) => setValue("typePageNewRelease", !!checked)}
            />
            <Label htmlFor={`${prefix}typePageNewRelease`} className="text-sm">{movieLabel} New Release</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}homePopular`}
              checked={getValue("homePopular")}
              onCheckedChange={(checked) => setValue("homePopular", !!checked)}
            />
            <Label htmlFor={`${prefix}homePopular`} className="text-sm">Home Popular</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${prefix}typePagePopular`}
              checked={getValue("typePagePopular")}
              onCheckedChange={(checked) => setValue("typePagePopular", !!checked)}
            />
            <Label htmlFor={`${prefix}typePagePopular`} className="text-sm">{movieLabel} Popular</Label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Content
        </CardTitle>
        <CardDescription>
          Add new movies or TV shows to your streaming platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter content title"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Content Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="tv_show">TV Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <Label>Genres *</Label>
            <div className="flex gap-2 mb-2">
              <Select 
                value="" 
                onValueChange={(value) => {
                  if (value && !formData.genres.includes(value)) {
                    setFormData(prev => ({
                      ...prev,
                      genres: [...prev.genres, value]
                    }));
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
              <Button type="button" onClick={addGenre} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.genres.map((genre, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {genre}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* TV Show Seasons */}
          {formData.type === "tv_show" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Seasons</Label>
                <Button type="button" onClick={addSeason} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Season
                </Button>
              </div>

              {seasons.map((season, seasonIndex) => (
                <Card key={seasonIndex} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Season {season.seasonNumber}</h3>
                    <Button 
                      type="button" 
                      onClick={() => removeSeason(seasonIndex)} 
                      variant="destructive" 
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={season.description}
                        onChange={(e) => updateSeason(seasonIndex, "description", e.target.value)}
                        placeholder="Season description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Release Year</Label>
                        <Input
                          type="number"
                          min="1900"
                          max="2030"
                          value={season.releaseYear}
                          onChange={(e) => updateSeason(seasonIndex, "releaseYear", parseInt(e.target.value) || new Date().getFullYear())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rating Type *</Label>
                        <Select 
                          value={season.ratingType} 
                          onValueChange={(value) => updateSeason(seasonIndex, "ratingType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating type" />
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
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="rating">Rating (0.0 - 10.0)</Label>
                          <Input
                              id="rating"
                              type="number"
                              min="0.0"
                              max="10.0"
                              step="0.1"
                              value={season.rating}
                              onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  updateSeason(seasonIndex, "rating", value);
                              }}
                              placeholder="Enter rating between 0.0 and 10.0"
                          />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Director</Label>
                      <Input
                        value={season.director}
                        onChange={(e) => updateSeason(seasonIndex, "director", e.target.value)}
                        placeholder="Director name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Writer</Label>
                      <Input
                        value={season.writer}
                        onChange={(e) => updateSeason(seasonIndex, "writer", e.target.value)}
                        placeholder="Writer name"
                      />
                    </div>
                  </div>

                  {/* Season Cast */}
                  <div className="space-y-2 mb-4">
                    <Label>Cast</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add cast member"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            addSeasonCastMember(seasonIndex, input.value);
                            input.value = "";
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={(e) => {
                          const input = (e.target as HTMLElement).closest('.flex')?.querySelector('input') as HTMLInputElement;
                          if (input) {
                            addSeasonCastMember(seasonIndex, input.value);
                            input.value = "";
                          }
                        }} 
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {season.cast.map((member, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {member}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSeasonCastMember(seasonIndex, member)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Thumbnail URL</Label>
                      <Input
                        type="url"
                        value={season.thumbnailUrl}
                        onChange={(e) => updateSeason(seasonIndex, "thumbnailUrl", e.target.value)}
                        placeholder="https://example.com/thumbnail.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trailer URL</Label>
                      <Input
                        type="url"
                        value={season.trailerUrl}
                        onChange={(e) => updateSeason(seasonIndex, "trailerUrl", e.target.value)}
                        placeholder="https://example.com/trailer.mp4"
                      />
                    </div>
                  </div>

                  {/* Season Feature Options */}
                  {renderFeatureCheckboxes(`season-${seasonIndex}-`, seasonIndex)}

                  {/* Episodes */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="font-semibold">Episodes</Label>
                      <Button 
                        type="button" 
                        onClick={() => addEpisode(seasonIndex)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Episode
                      </Button>
                    </div>

                    {season.episodes.map((episode, episodeIndex) => (
                      <Card key={episodeIndex} className="p-3 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Episode {episode.episodeNumber}</h4>
                          <Button 
                            type="button" 
                            onClick={() => removeEpisode(seasonIndex, episodeIndex)} 
                            variant="destructive" 
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Episode Title</Label>
                            <Input
                              value={episode.title}
                              onChange={(e) => updateEpisode(seasonIndex, episodeIndex, "title", e.target.value)}
                              placeholder="Episode title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input
                              value={episode.duration}
                              onChange={(e) => updateEpisode(seasonIndex, episodeIndex, "duration", e.target.value)}
                              placeholder="e.g., 45 min"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Input
                              type="url"
                              value={episode.videoUrl}
                              onChange={(e) => updateEpisode(seasonIndex, episodeIndex, "videoUrl", e.target.value)}
                              placeholder="https://example.com/episode.mp4"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Thumbnail URL</Label>
                            <Input
                              type="url"
                              value={episode.thumbnailUrl}
                              onChange={(e) => updateEpisode(seasonIndex, episodeIndex, "thumbnailUrl", e.target.value)}
                              placeholder="https://example.com/thumbnail.jpg"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <Label>Description</Label>
                          <Textarea
                            value={episode.description}
                            onChange={(e) => updateEpisode(seasonIndex, episodeIndex, "description", e.target.value)}
                            placeholder="Episode description"
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Movie-specific fields */}
          {formData.type === "movie" && (
            <>
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter content description"
                  rows={4}
                />
              </div>

              {/* Release Year & Rating */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Release Year</Label>
                  <Input
                    id="releaseYear"
                    type="number"
                    min="1900"
                    max="2030"
                    value={formData.releaseYear}
                    onChange={(e) => handleInputChange("releaseYear", parseInt(e.target.value) || new Date().getFullYear())}
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratingType">Rating Type *</Label>
                  <Select 
                    value={formData.ratingType} 
                    onValueChange={(value) => handleInputChange("ratingType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating type" />
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
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                      <Label htmlFor="rating">Rating (0.0 - 10.0)</Label>
                      <Input
                          id="rating"
                          type="number"
                          min="0.0"
                          max="10.0"
                          step="0.1"
                          value={formData.rating}
                          onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              handleInputChange("rating", value);
                          }}
                          placeholder="Enter rating between 0.0 and 10.0"
                      />
                  </div>
              </div>

              {/* Director & Writer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="director">Director</Label>
                  <Input
                    id="director"
                    value={formData.director}
                    onChange={(e) => handleInputChange("director", e.target.value)}
                    placeholder="Director name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writer">Writer</Label>
                  <Input
                    id="writer"
                    value={formData.writer}
                    onChange={(e) => handleInputChange("writer", e.target.value)}
                    placeholder="Writer name"
                  />
                </div>
              </div>

              {/* Cast */}
              <div className="space-y-2">
                <Label>Cast</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newCastMember}
                    onChange={(e) => setNewCastMember(e.target.value)}
                    placeholder="Add cast member"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCastMember();
                      }
                    }}
                  />
                  <Button type="button" onClick={addCastMember} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.cast.map((member, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {member}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCastMember(member)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => handleInputChange("thumbnailUrl", e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailerUrl">Trailer URL</Label>
                  <Input
                    id="trailerUrl"
                    type="url"
                    value={formData.trailerUrl}
                    onChange={(e) => handleInputChange("trailerUrl", e.target.value)}
                    placeholder="https://example.com/trailer.mp4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>

              {/* Movie Feature Options */}
              {renderFeatureCheckboxes()}
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button 
              type="submit" 
              disabled={createContentMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createContentMutation.isPending ? "Creating..." : "Create Content"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContentUploadForm;