"use client";

import { useState } from 'react';
import type { Project } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Plus, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


interface ProjectSelectorProps {
    projects: Project[];
    currentProject?: Project;
    onSelectProject: (projectId: string) => void;
    onCreateProject: (projectName: string) => void;
    onShareProject: (email: string) => void;
}

export function ProjectSelector({ projects, currentProject, onSelectProject, onCreateProject, onShareProject }: ProjectSelectorProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [shareEmail, setShareEmail] = useState("");

    const handleCreateProject = () => {
        if(newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName("");
            setIsCreateDialogOpen(false);
        }
    }

    const handleShareProject = () => {
        if(shareEmail.trim()) {
            onShareProject(shareEmail.trim());
            setShareEmail("");
            setIsShareDialogOpen(false);
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

            {/* Share Project Dialog */}
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsShareDialogOpen(true)} disabled={!currentProject}>
                                <UserPlus className="h-5 w-5" />
                                <span className="sr-only">Share Project</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Share Project</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share "{currentProject?.name}"</DialogTitle>
                        <DialogDescription>
                            Enter the email of the user you want to share this project with.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input 
                            placeholder="user@example.com"
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleShareProject()}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleShareProject}>Share</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Project Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="h-5 w-5" />
                                <span className="sr-only">New Project</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>New Project</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
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
                        <Button onClick={handleCreateProject}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
