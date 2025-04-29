# RoboMovie Development Guide

This guide outlines the development standards, best practices, and workflows for the RoboMovie project.

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig
- Define explicit types (avoid `any`)
- Use interfaces for complex objects
- Document public APIs with JSDoc comments

Example:
```typescript
interface MovieSettings {
  /** The title of the movie */
  title: string;
  /** Duration in minutes */
  length: number;
  /** Movie genre */
  genre: string;
  /** Optional topic or theme */
  topic?: string;
}

/**
 * Creates a new movie project with the specified settings
 * @param settings - The movie configuration
 * @returns The created movie project
 * @throws {Error} If validation fails
 */
async function createMovie(settings: MovieSettings): Promise<Movie> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Implement proper prop types
- Keep components focused and single-responsibility
- Use composition over inheritance
- Implement error boundaries where appropriate

Example:
```typescript
interface SceneProps {
  sceneNumber: number;
  title: string;
  description: string;
  onUpdate: (sceneId: string, updates: Partial<Scene>) => void;
}

export function Scene({ sceneNumber, title, description, onUpdate }: SceneProps) {
  const handleChange = useCallback((field: keyof Scene, value: any) => {
    onUpdate(sceneNumber.toString(), { [field]: value });
  }, [sceneNumber, onUpdate]);

  return (
    <div className="scene-container">
      {/* Component implementation */}
    </div>
  );
}
```

### State Management

- Use Zustand for global state
- Keep state minimal and normalized
- Implement proper state hydration
- Use local state for component-specific data

Example:
```typescript
interface Store {
  scenes: Scene[];
  selectedScene: Scene | null;
  setScenes: (scenes: Scene[]) => void;
  selectScene: (scene: Scene | null) => void;
}

export const useStore = create<Store>((set) => ({
  scenes: [],
  selectedScene: null,
  setScenes: (scenes) => set({ scenes }),
  selectScene: (scene) => set({ selectedScene: scene })
}));
```

### API Integration

- Use typed API clients
- Implement proper error handling
- Cache responses where appropriate
- Handle loading and error states

Example:
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

function useSceneData(sceneId: string): ApiResponse<Scene> {
  const [state, setState] = useState<ApiResponse<Scene>>({
    loading: true
  });

  useEffect(() => {
    async function fetchScene() {
      try {
        const response = await fetch(`/api/scenes/${sceneId}`);
        const data = await response.json();
        setState({ data, loading: false });
      } catch (error) {
        setState({ error: error.message, loading: false });
      }
    }
    fetchScene();
  }, [sceneId]);

  return state;
}
```

## Project Structure

### Frontend Organization

```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   ├── video-editor/   # Video editor components
│   └── shared/         # Shared components
├── pages/              # Page components
├── lib/                # Utilities and hooks
│   ├── hooks/          # Custom hooks
│   ├── store/          # State management
│   └── utils/          # Helper functions
├── types/              # TypeScript definitions
└── assets/             # Static assets
```

### Backend Organization

```
backend/
├── routes/             # API routes
├── services/           # Business logic
├── middleware/         # Express middleware
└── utils/             # Helper functions
```

## Development Workflow

### 1. Feature Development

1. Create feature branch from main
   ```bash
   git checkout -b feature/new-feature
   ```

2. Implement changes following these steps:
   - Add/update types and interfaces
   - Implement backend services/routes
   - Create/update components
   - Add tests
   - Update documentation

3. Run local tests
   ```bash
   npm run test
   npm run lint
   ```

4. Commit changes with conventional commits
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve issue"
   git commit -m "docs: update documentation"
   ```

### 2. Code Review Process

Before submitting a PR:
- Ensure all tests pass
- Update relevant documentation
- Add comments for complex logic
- Remove debug code
- Check for security issues

PR template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed

## Screenshots
(if applicable)
```

### 3. Testing Guidelines

#### Unit Tests

- Test components in isolation
- Mock external dependencies
- Test error cases
- Use meaningful test descriptions

Example:
```typescript
describe('SceneComponent', () => {
  it('should render scene details correctly', () => {
    const scene = {
      id: '1',
      title: 'Test Scene',
      description: 'Test Description'
    };
    
    const { getByText } = render(<Scene {...scene} />);
    expect(getByText('Test Scene')).toBeInTheDocument();
  });

  it('should handle updates correctly', () => {
    const onUpdate = jest.fn();
    const { getByRole } = render(
      <Scene id="1" onUpdate={onUpdate} />
    );
    
    fireEvent.click(getByRole('button'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

#### Integration Tests

- Test component interactions
- Test API integration
- Test state management
- Test error handling

### 4. Performance Considerations

- Implement proper memoization
- Use lazy loading for routes/components
- Optimize bundle size
- Monitor render cycles

Example:
```typescript
const MemoizedComponent = memo(function Component({ data }: Props) {
  return <div>{/* Component implementation */}</div>;
}, (prev, next) => prev.data.id === next.data.id);

const LazyComponent = lazy(() => import('./HeavyComponent'));
```

### 5. Security Best Practices

- Validate all inputs
- Implement proper authentication
- Use HTTPS
- Sanitize user content
- Follow OWASP guidelines

Example:
```typescript
function validateInput(data: unknown): asserts data is MovieSettings {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input');
  }

  const settings = data as Partial<MovieSettings>;
  
  if (typeof settings.title !== 'string' || settings.title.length < 1) {
    throw new Error('Invalid title');
  }
  
  // Additional validation
}
```

## Deployment

### 1. Environment Configuration

- Use environment variables
- Keep secrets secure
- Configure proper CORS
- Set up rate limiting

Example `.env`:
```env
NODE_ENV=production
API_URL=https://api.example.com
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Build Process

```bash
# Build frontend
npm run build

# Build backend (if using TypeScript)
npm run build:server

# Run production server
npm run start:prod
```

### 3. Monitoring

- Implement error tracking
- Monitor API performance
- Track user metrics
- Set up alerts

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify dependencies
   - Clear cache and node_modules

2. **Runtime Errors**
   - Check console logs
   - Verify API responses
   - Check environment variables

3. **Performance Issues**
   - Profile component renders
   - Check network requests
   - Monitor memory usage

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Express Documentation](https://expressjs.com)
