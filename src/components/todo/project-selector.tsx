"use client";

import { useState } from 'react';
import type { Project } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Folder, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"


interface ProjectSelectorProps {
    projects: Project[];
    currentProject?: Project;
    onSelectProject: (projectId: string) => void;
    onCreateProject: (projectName: string) => void;
}

export function ProjectSelector({ projects, currentProject, onSelectProject, onCreateProject }: ProjectSelectorProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    const handleCreateProject = () => {
        if(newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName("");
            setIsDialogOpen(false);
        }
    }
    
    return (
        <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            <Select onValueChange={onSelectProject} value={currentProject?.id}>
                <SelectTrigger className="flex-1 w-full bg-muted/50">
                    <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                    {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">New Project</span>
                </Button>
                 <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Give your new project a name. You can share it with others later.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input 
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreateProject}>Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
