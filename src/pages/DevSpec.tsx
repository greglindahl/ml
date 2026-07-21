import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const DevSpec = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Navigation Developer Spec | Handoff Documentation</title>
      </Helmet>

      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Prototype
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Navigation System Developer Spec</h1>
          <p className="text-muted-foreground">Technical handoff documentation for development team</p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="#layout-overview" className="text-primary hover:underline">1. Layout Overview</a></li>
            <li><a href="#left-nav" className="text-primary hover:underline">2. Left Navigation (Desktop)</a></li>
            <li><a href="#mobile-nav" className="text-primary hover:underline">3. Mobile Navigation</a></li>
            <li><a href="#top-header" className="text-primary hover:underline">4. Top Header Icons</a></li>
            <li><a href="#org-switcher" className="text-primary hover:underline">5. Organization Switcher</a></li>
            <li><a href="#nav-items" className="text-primary hover:underline">6. Navigation Items</a></li>
            <li><a href="#design-tokens" className="text-primary hover:underline">7. Design Tokens / CSS Variables</a></li>
            <li><a href="#responsive" className="text-primary hover:underline">8. Responsive Behavior</a></li>
            <li><a href="#animations" className="text-primary hover:underline">9. Animations & Transitions</a></li>
          </ul>
        </nav>

        {/* Layout Overview */}
        <section id="layout-overview" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Layout Overview</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground mb-4">
              The application uses a sidebar-based layout with a collapsible left navigation and fixed top-right utility icons.
            </p>
            
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Layout Structure</h4>
              <pre className="text-xs overflow-x-auto bg-card p-3 rounded border">
{`┌─────────────────────────────────────────────────────────┐
│                              [🔔] [✉️] [👤] (Top Right) │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Left    │           Main Content Area                  │
│  Nav     │                                              │
│          │                                              │
│  72px    │           flex-1                             │
│  or      │                                              │
│  256px   │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘`}
              </pre>
            </div>

            <h4 className="font-medium mt-6 mb-2">Key Measurements</h4>
            <table className="w-full text-sm border-collapse border">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-2 text-left">Element</th>
                  <th className="border p-2 text-left">Desktop</th>
                  <th className="border p-2 text-left">Mobile</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Left Nav Width (Collapsed)</td>
                  <td className="border p-2"><code>72px</code></td>
                  <td className="border p-2">N/A (hidden)</td>
                </tr>
                <tr>
                  <td className="border p-2">Left Nav Width (Expanded)</td>
                  <td className="border p-2"><code>256px</code></td>
                  <td className="border p-2"><code>280px</code></td>
                </tr>
                <tr>
                  <td className="border p-2">Header Height</td>
                  <td className="border p-2"><code>80px</code> (pt-20)</td>
                  <td className="border p-2"><code>72px</code> (pt-[72px])</td>
                </tr>
                <tr>
                  <td className="border p-2">Mobile Header Bar</td>
                  <td className="border p-2">N/A</td>
                  <td className="border p-2"><code>56px</code> (h-14)</td>
                </tr>
                <tr>
                  <td className="border p-2">Content Bottom Padding</td>
                  <td className="border p-2" colSpan={2}><code>48px</code> (pb-12 / 3rem)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Left Navigation */}
        <section id="left-nav" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Left Navigation (Desktop)</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Container Specs</h4>
              <table className="w-full text-sm border-collapse border">
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium w-1/3">Position</td>
                    <td className="border p-2">Static (part of flex layout)</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Height</td>
                    <td className="border p-2"><code>100vh</code> (h-screen)</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Background</td>
                    <td className="border p-2"><code>bg-nav-background</code> → <code>#12263F</code> (dark navy)</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Border</td>
                    <td className="border p-2"><code>border-r border-nav-border</code> → <code>#283E59</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Width Transition</td>
                    <td className="border p-2"><code>0.2s ease-out</code> (nav-transition class)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Toggle Button</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Position: Absolute, <code>top-8 -right-3</code></li>
                <li>Size: <code>24px × 24px</code> (w-6 h-6)</li>
                <li>Visibility: <code>opacity-0</code> by default, <code>group-hover:opacity-100</code></li>
                <li>Background: <code>bg-nav-background</code> with border</li>
                <li>Icon: Bootstrap Icons <code>bi-layout-sidebar</code></li>
                <li>Tooltip: "Collapse" or "Expand" (right side)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Structure</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`<nav> (flex-col, h-screen)
  ├── Toggle Button (absolute, hover-visible)
  ├── Header (org switcher, border-b)
  ├── Main Nav Items (flex-1, py-2)
  ├── Divider (mx-4, border-t)
  └── Bottom Nav Items (py-2, help/settings)`}
              </pre>
            </div>
          </div>
        </section>

        {/* Mobile Navigation */}
        <section id="mobile-nav" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Mobile Navigation</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Drawer Behavior</h4>
              <table className="w-full text-sm border-collapse border">
                <tbody>
                  <tr>
                    <td className="border p-2 font-medium w-1/3">Type</td>
                    <td className="border p-2">Slide-in drawer from left</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Width</td>
                    <td className="border p-2"><code>280px</code> (w-[280px])</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Position</td>
                    <td className="border p-2"><code>fixed top-0 left-0 z-50</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Transition</td>
                    <td className="border p-2"><code>transform 0.3s ease-out</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Hidden State</td>
                    <td className="border p-2"><code>-translate-x-full</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-medium">Visible State</td>
                    <td className="border p-2"><code>translate-x-0</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mobile Header Bar</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Height: <code>56px</code> (h-14)</li>
                <li>Background: <code>bg-card</code></li>
                <li>Position: <code>fixed top-0 left-0 right-0 z-40</code></li>
                <li>Contains: Hamburger menu button (left)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Backdrop</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Coverage: <code>fixed inset-0 z-40</code></li>
                <li>Background: <code>bg-background/80 backdrop-blur-sm</code></li>
                <li>Behavior: Click to close drawer</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mobile Drawer Header</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Contains: Org switcher (left) + Close button (right)</li>
                <li>Border: <code>border-b border-nav-border</code></li>
                <li>Padding: <code>p-4</code></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Top Header Icons */}
        <section id="top-header" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Top Header Icons</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Container Position</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Position: <code>fixed top-4 right-4 z-50</code></li>
                <li>Layout: <code>flex items-center gap-4</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Icon Buttons</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Icon</th>
                    <th className="border p-2 text-left">Bootstrap Icon Class</th>
                    <th className="border p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Announcements</td>
                    <td className="border p-2"><code>bi-megaphone</code></td>
                    <td className="border p-2">No badge</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Messages</td>
                    <td className="border p-2"><code>bi-envelope</code></td>
                    <td className="border p-2">Badge showing count (e.g., "99+")</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Profile</td>
                    <td className="border p-2">Avatar component</td>
                    <td className="border p-2">36px (h-9 w-9), fallback icon</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Icon Button Styling</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Padding: <code>p-2</code></li>
                <li>Hover: <code>hover:bg-accent</code></li>
                <li>Border radius: <code>rounded-md</code></li>
                <li>Icon color: <code>text-topnav-icon</code> → <code>#95AAC9</code></li>
                <li>Icon hover: <code>hover:text-topnav-icon-hover</code> → <code>#6E84A3</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Badge Styling</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`Position: absolute -top-1 -right-1
Background: bg-primary (#2C7BE5)
Text: text-primary-foreground (white)
Font: text-xs font-medium
Padding: px-1.5 py-0.5
Border radius: rounded-full
Min width: min-w-[20px]`}
              </pre>
            </div>
          </div>
        </section>

        {/* Organization Switcher */}
        <section id="org-switcher" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Organization Switcher</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Desktop (Collapsed Nav)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Shows: Logo image only (40px × 40px)</li>
                <li>Click: Opens dropdown menu</li>
                <li>Hover: Slight opacity change</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Desktop (Expanded Nav)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Shows: Logo + Org name + Chevron</li>
                <li>Layout: <code>flex items-center gap-3</code></li>
                <li>Text color: <code>text-nav-text</code></li>
                <li>Hover: <code>hover:bg-sidebar-accent</code></li>
                <li>Border radius: <code>rounded-md</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mobile</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Always shows full width with logo + name + chevron</li>
                <li>Same dropdown behavior as desktop expanded</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Dropdown Menu</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Width: <code>w-56</code> (224px)</li>
                <li>Items: List of organizations with initial/logo + name</li>
                <li>Active state: <code>bg-sidebar-accent</code></li>
                <li>Selection: Updates active org, closes menu</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Navigation Items */}
        <section id="nav-items" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Navigation Items</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Main Nav Items</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Label</th>
                    <th className="border p-2 text-left">Icon (Default)</th>
                    <th className="border p-2 text-left">Icon (Active)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Home</td>
                    <td className="border p-2"><code>bi-house</code></td>
                    <td className="border p-2"><code>bi-house-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Library</td>
                    <td className="border p-2"><code>bi-image</code></td>
                    <td className="border p-2"><code>bi-image-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Connect</td>
                    <td className="border p-2"><code>bi-plug</code></td>
                    <td className="border p-2"><code>bi-plug-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Engage</td>
                    <td className="border p-2"><code>bi-cloud-arrow-up</code></td>
                    <td className="border p-2"><code>bi-cloud-arrow-up-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Requests</td>
                    <td className="border p-2"><code>bi-camera</code></td>
                    <td className="border p-2"><code>bi-camera-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Insights</td>
                    <td className="border p-2"><code>bi-bar-chart</code></td>
                    <td className="border p-2"><code>bi-bar-chart-fill</code></td>
                  </tr>
                  <tr>
                    <td className="border p-2">Admin</td>
                    <td className="border p-2"><code>bi-shield-lock</code></td>
                    <td className="border p-2"><code>bi-shield-lock-fill</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Bottom Nav Items</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Label</th>
                    <th className="border p-2 text-left">Icon (Default)</th>
                    <th className="border p-2 text-left">Icon (Active)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Help</td>
                    <td className="border p-2"><code>bi-question-circle</code></td>
                    <td className="border p-2"><code>bi-question-circle-fill</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">NavItem States</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">State</th>
                    <th className="border p-2 text-left">Styles</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Default</td>
                    <td className="border p-2">
                      <code>text-nav-text</code> (#B1C2D9)<br />
                      <code>border-l-2 border-transparent</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Hover</td>
                    <td className="border p-2">
                      <code>text-nav-text-hover</code> (white)<br />
                      <code>bg-sidebar-accent</code> (#283E59)
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">Active</td>
                    <td className="border p-2">
                      <code>text-nav-text-active</code> (white)<br />
                      <code>bg-sidebar-accent</code> (#283E59)<br />
                      <code>border-l-2 border-nav-active-border</code> (#2C7BE5)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">NavItem Layout</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Vertical padding: <code>py-3</code> (12px)</li>
                <li>Horizontal padding (expanded): <code>px-4</code> (16px)</li>
                <li>Horizontal padding (collapsed): centered (<code>justify-center</code>)</li>
                <li>Gap between icon and text: <code>gap-3</code> (12px)</li>
                <li>Icon size: <code>bi-md</code> (1.25rem / 20px)</li>
                <li>Text size: <code>text-sm</code> (14px)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Collapsed State Tooltip</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Trigger: Hover on nav item when collapsed</li>
                <li>Position: <code>side="right"</code></li>
                <li>Delay: <code>delayDuration={0}</code></li>
                <li>Content: Label text</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Design Tokens */}
        <section id="design-tokens" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Design Tokens / CSS Variables</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Navigation Colors (Light Mode)</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Variable</th>
                    <th className="border p-2 text-left">HSL Value</th>
                    <th className="border p-2 text-left">Hex</th>
                    <th className="border p-2 text-left">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2"><code>--nav-background</code></td>
                    <td className="border p-2">213 53% 16%</td>
                    <td className="border p-2">#12263F</td>
                    <td className="border p-2">Sidebar background</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-border</code></td>
                    <td className="border p-2">213 35% 25%</td>
                    <td className="border p-2">#283E59</td>
                    <td className="border p-2">Sidebar borders</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-text</code></td>
                    <td className="border p-2">214 30% 77%</td>
                    <td className="border p-2">#B1C2D9</td>
                    <td className="border p-2">Default nav text</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-text-hover</code></td>
                    <td className="border p-2">0 0% 100%</td>
                    <td className="border p-2">#FFFFFF</td>
                    <td className="border p-2">Hover text color</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-text-active</code></td>
                    <td className="border p-2">0 0% 100%</td>
                    <td className="border p-2">#FFFFFF</td>
                    <td className="border p-2">Active item text</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-active-border</code></td>
                    <td className="border p-2">210 72% 53%</td>
                    <td className="border p-2">#2C7BE5</td>
                    <td className="border p-2">Active left border</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--sidebar-accent</code></td>
                    <td className="border p-2">213 35% 25%</td>
                    <td className="border p-2">#283E59</td>
                    <td className="border p-2">Hover/active background</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Top Nav Icon Colors</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Variable</th>
                    <th className="border p-2 text-left">HSL Value</th>
                    <th className="border p-2 text-left">Hex</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2"><code>--topnav-icon</code></td>
                    <td className="border p-2">214 25% 69%</td>
                    <td className="border p-2">#95AAC9</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--topnav-icon-hover</code></td>
                    <td className="border p-2">215 22% 54%</td>
                    <td className="border p-2">#6E84A3</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--topnav-icon-mobile</code></td>
                    <td className="border p-2">214 29% 33%</td>
                    <td className="border p-2">#3B506C</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-medium mb-2">Layout Variables</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Variable</th>
                    <th className="border p-2 text-left">Value</th>
                    <th className="border p-2 text-left">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2"><code>--nav-collapsed</code></td>
                    <td className="border p-2">72px</td>
                    <td className="border p-2">Collapsed nav width</td>
                  </tr>
                  <tr>
                    <td className="border p-2"><code>--nav-expanded</code></td>
                    <td className="border p-2">256px</td>
                    <td className="border p-2">Expanded nav width</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Responsive Behavior */}
        <section id="responsive" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Responsive Behavior</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Breakpoint</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Mobile/Desktop threshold: <code>768px</code> (md breakpoint)</li>
                <li>Detection: <code>useIsMobile()</code> hook using <code>window.matchMedia</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Desktop Behavior</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Left nav is always visible</li>
                <li>Toggle button collapses/expands nav</li>
                <li>Nav starts in collapsed state by default</li>
                <li>Content area adjusts width based on nav state</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mobile Behavior</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Left nav is hidden by default</li>
                <li>Mobile header bar with hamburger menu</li>
                <li>Hamburger opens slide-in drawer</li>
                <li>Backdrop overlay when drawer is open</li>
                <li>Tap backdrop or close button to dismiss</li>
                <li>Navigation closes on route change</li>
                <li>Nav always shows in expanded state when open</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Content Area Padding</h4>
              <table className="w-full text-sm border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Breakpoint</th>
                    <th className="border p-2 text-left">Horizontal Padding</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Mobile (default)</td>
                    <td className="border p-2"><code>px-4</code> (16px)</td>
                  </tr>
                  <tr>
                    <td className="border p-2">md (≥768px)</td>
                    <td className="border p-2"><code>md:px-8</code> (32px)</td>
                  </tr>
                  <tr>
                    <td className="border p-2">xl (≥1280px)</td>
                    <td className="border p-2"><code>xl:px-16</code> (64px)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Animations */}
        <section id="animations" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Animations & Transitions</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Nav Width Transition (Desktop)</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`.nav-transition {
  transition: width 0.2s ease-out;
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Mobile Drawer Slide</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`transition: transform 0.3s ease-out;

/* Hidden */
transform: translateX(-100%);

/* Visible */
transform: translateX(0);`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Toggle Button Opacity</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`/* Default */
opacity: 0;

/* On parent hover (group-hover) */
opacity: 1;

transition: opacity (default Tailwind);`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">NavItem Hover</h4>
              <pre className="text-xs overflow-x-auto bg-muted p-3 rounded border">
{`transition: colors 150ms;
/* Applies to text-color and background-color */`}
              </pre>
            </div>
          </div>
        </section>

        {/* User Testing Scenarios */}
        <section id="user-testing" className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">10. User Testing Scenarios</h2>
          
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h4 className="font-medium mb-2 text-primary">Task 1: The "Brand Compliance" Audit (Intersectionality)</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Scenario:</span>
                  <p className="text-sm mt-1">"A sponsor needs to see every Photo of LeBron James from Season 2024 that features Nike branding."</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">What this tests:</span>
                  <p className="text-sm mt-1">Can the user successfully combine multiple specific facets (Content Type + Player + Season/Location + Brand) without getting lost in the UI?</p>
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <span className="text-xs font-medium text-muted-foreground">Facets to combine:</span>
                  <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Content Type: Photo</li>
                    <li>Player: LeBron James</li>
                    <li>Season: 2024</li>
                    <li>Brand: Nike</li>
                  </ul>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h4 className="font-medium mb-2 text-primary">Task 2: The "Bulk Curation" (Organization & Selection)</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Scenario:</span>
                  <p className="text-sm mt-1">"You need to pull a group of assets created by Mike Ross to start a new 'Highlights' gallery. Find all his files and select them for export."</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">What this tests:</span>
                  <p className="text-sm mt-1">Effectiveness of the 'Creator' filter combined with the Selection Mode (the checkboxes and multi-select logic).</p>
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <span className="text-xs font-medium text-muted-foreground">Key interactions:</span>
                  <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Filter by Creator: Mike Ross</li>
                    <li>Enter Selection Mode</li>
                    <li>Multi-select assets (checkboxes)</li>
                    <li>Export selected items</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h4 className="font-medium mb-2 text-primary">Task 3: The "Broad Discovery" (Scene-Based Search)</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Scenario:</span>
                  <p className="text-sm mt-1">"You're looking for 'hype' content. Find all Video clips across the entire library that involve a Dunk or a Three Pointer."</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">What this tests:</span>
                  <p className="text-sm mt-1">Does the user go to the "More" filters for 'Scene', or do they try typing "Dunk Video" into the Command Palette? (Tests search intent vs. facet navigation).</p>
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <span className="text-xs font-medium text-muted-foreground">Possible approaches:</span>
                  <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Facet path: Content Type → Video, then Scene → Dunk / Three Pointer</li>
                    <li>Search path: Command Palette → "Dunk Video"</li>
                    <li>Hybrid: Filter by Video, then search "Dunk"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h4 className="font-medium mb-2 text-primary">Task 4: The "Deep Dive" (Navigation vs. Search)</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Scenario:</span>
                  <p className="text-sm mt-1">"Your manager told you the files are in the 'Warriors vs Clippers' folder. Find that specific folder and verify it contains James Harden assets."</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">What this tests:</span>
                  <p className="text-sm mt-1">The usability of the Folder Panel and the Locations facet. It determines if users prefer a "click-through" hierarchy or if they'll just type "Clippers" into the search bar.</p>
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <span className="text-xs font-medium text-muted-foreground">Possible approaches:</span>
                  <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Folder path: Navigate folder hierarchy → Warriors vs Clippers → Browse contents</li>
                    <li>Search path: Command Palette → "Warriors Clippers" or "Clippers folder"</li>
                    <li>Hybrid: Location facet → Search within filtered results for "Harden"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Navigation System Developer Specification</p>
          <p className="mt-1">For questions, contact the design team.</p>
        </footer>
      </div>
    </div>
  );
};

export default DevSpec;