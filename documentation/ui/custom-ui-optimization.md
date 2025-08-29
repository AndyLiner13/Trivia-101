# Custom UI Optimization

Custom UI allows for maximum developer flexibility but misuse of the feature can significantly degrade performance. Since UIs are built using a TypeScript API, several observations follow from the TypeScript Optimization section, above. For what follows, the reader is assumed to have a good understanding of the Custom UI TypeScript API. See [Custom UI](https://developers.meta.com/horizon-worlds/learn/documentation/typescript/api-references-and-examples/custom-ui/) docs.

• We suggest keeping main thread CPU cost under 0.5ms per frame on the local client, and 1.5ms per frame on the server (See Profiling UI section below).
• Reduce binding set calls.
• Binding set calls and callbacks are networked RPC events between the local client and server, so the total time of each async operation is bound by the network latency of the viewer.

## Architecture

Here is a diagram to give more context to the performance guidance below.

![Architecture Diagram](https://scontent-hou1-1.xx.fbcdn.net/v/t39.2365-6/452694018_512500247954598_2260285939721962465_n.png?_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=0d__rLvZKGUQ7kNvwHd-ATw&_nc_oc=AdkZMU3VIzGRHSFzhfiHlBkLN5aH3kAfchOIv8i8wFiE0YDVNcAFWFVrHtyOlk3SZHY&_nc_zt=14&_nc_ht=scontent-hou1-1.xx&_nc_gid=K9jr-N3fejZsW7oybFuI9g&oh=00_AfWe5hLOxDT)

## Profiling UI

It will be helpful to review the [Deep profiling](https://developers.meta.com/horizon-worlds/learn/documentation/performance-best-practices-and-tooling/performance-best-practices/cpu-and-typescript-optimization-best-practices#typescript-optimization) section of the [CPU and TypeScript Optimization Best Practices doc](https://developers.meta.com/horizon-worlds/learn/documentation/performance-best-practices-and-tooling/performance-best-practices/cpu-and-typescript-optimization-best-practices/).

There is a bridge call and a network RPC event associated with every UI binding set and callback. These actions make up for all main thread synchronous costs associated with UI. Target a CPU total cost for all UI in the world of less than 0.5ms per frame on the local client, and 1.5ms per frame on the server.

From a Deep trace pulled into Perfetto, watch the synchronous cost of these markers:

### For binding sets, look at these traces:

**Client:**
- Verts::PollDriver::PreFrame
- Verts::PollDriver::Rpc
- CustomUI::UpdateBinding

**Server:**
- ScriptingRuntime::Bridge::SetUIBindings
- CustomUI::UpdateBinding::Send

### For callbacks, look at these traces:

**Client:**
- Verts::Update

**Server:**
- ScriptingRuntime::HandleEvent::customuicallbackinternal

### Other useful traces:
- CustomUI::UpdateImage::Send (server)
- CustomUI::UpdateImage (client)
- CustomUI::InitializeState::Send (server)
- CustomUI::InitializeState (client)

One useful method to make sense of this in aggregate is to drag a 5 second block across the main thread and look at the total wall time for that marker, divided by 360. For Verts::PollDriver::Rpc in the screengrab below, that is 0.25 ms (90.03099 wall duration in seconds divided by 360 frames).

![Profiling Example](https://scontent-hou1-1.xx.fbcdn.net/v/t39.2365-6/452531523_512500287954594_2391930062797882965_n.png?_nc_cat=103&ccb=1-7&_nc_sid=e280be&_nc_ohc=2SkRwJI20nQQ7kNvwGsfAHk&_nc_oc=Adk-e6ik_yyzIa4cONskiTeuY8fwZGdThpd4b6tnjsGK59wrOvAAklrtz789X4kcUuQ&_nc_zt=14&_nc_ht=scontent-hou1-1.xx&_nc_gid=K9jr-N3fejZsW7oybFuI9g&oh=00_AfW4nf5yvQig)

## Binding set and callback frequency limits

The following table shows the limit we have found for binding sets and callbacks. Exceeding this will likely exceed the 1 ms per frame cost limit outlined above.

| Type | Server | Client |
|------|--------|--------|
| Binding set | <= 20 per frame (for all users) | <= 10 per frame |
| Callback | <= 1 per 2 frames (for all users) | <= 1 per 2 frames |

## Network latency limitations

The communication loop between a UI panel rendered on a client, and the associated TypeScript engine on the server, is limited by the network latency of the viewer. Common situations in which this should be factored in:

• Style changes based on raycast/mouse interaction events like OnHover
• Animations driven from TypeScript by a sequence of binding set updates over a period

Even working within the binding and callback limits above, viewers may notice UI delays associated with the network call round-trip.

## Memory usage

Textures by far outweigh any other memory cost associated with a UI entity. This includes a mandatory ~40 MB ReactVR panel render texture, as well as a copy of any texture asset referenced by a UI image component (once per UI entity that contains a reference to that asset, no matter how many times).

Setting the visibility of a UI entity to false frees all textures to garbage collection. As such, everything in the [Spawning objects](https://developers.meta.com/horizon-worlds/learn/documentation/performance-best-practices-and-tooling/performance-best-practices/cpu-and-typescript-optimization-best-practices#spawning-objects) section of the [CPU and TypeScript Optimization Best Practices doc](https://developers.meta.com/horizon-worlds/learn/documentation/performance-best-practices-and-tooling/performance-best-practices/cpu-and-typescript-optimization-best-practices/) applies here, and toggling visibility can be a costly operation (especially on the server).

Where possible, set the visibility of the UI entity to true at initialization, and leave it that way.

## ReactVR

In testing, we have found bridge calls and RPC costs to be the bottleneck setting the limit for binding/callback frequency, and not ReactVR. That isn't to say a sufficiently complex virtual DOM could present limits on the ReactVR side, too.

If you suspect issues with this due to the UI being laggy or slow to refresh, we recommend using the [Meta Quest Developer Hub](https://developer.oculus.com/meta-quest-developer-hub/?intern_source=devblog&intern_content=meta-quest-developer-hub-mqdh-30) (MQDH) desktop software to study deeper.

![MQDH Interface](https://scontent-hou1-1.xx.fbcdn.net/v/t39.2365-6/452916138_512500291287927_6920496205870430314_n.png?_nc_cat=108&ccb=1-7&_nc_sid=e280be&_nc_ohc=JWaXcYRJ70wQ7kNvwEkFtFx&_nc_oc=AdkhjMsqZRftS97mYFRWSBPEA_AcuKWn6Yj7GcNaN6lxDOppRktns0qWMIwaXFXwA2k&_nc_zt=14&_nc_ht)

Here, a Perfetto trace can be pulled in the Performance section, similar to the in-app trace that was described before. The difference is that this trace shows activity in the Hermes thread, which holds work done by the ReactVR runtime engine.

![Hermes Thread Trace](https://scontent-hou1-1.xx.fbcdn.net/v/t39.2365-6/452678439_512500237954599_2792407842991222345_n.png?_nc_cat=106&ccb=1-7&_nc_sid=e280be&_nc_ohc=JQwDXDic-J8Q7kNvwH_2giX&_nc_oc=AdlMDRi95RCrUh8tPWbXOQug8X9jzuXRc0GvY8k0ffF-akEYPKsjJ-vMUu8ANelrCNY&_nc_zt=14&_nc_ht=scontent-hou1-1.xx&_nc_gid=K9jr-N3fejZsW7oybFuI9g&oh=00_AfUtqtXEuxpWK2xmVyliw-9tupHe7)

In the screenshot above, running time (the green square) of the Hermes thread, across a 5 second segment, is around 1%. Try to keep this less than 50%, to leave room for other Horizon system UI.

## Gotchas and anti-patterns

Some constructs may seem benign, but are not a good fit for Custom UI (at this time), so we call them out below.

1. **Do not define bindings without a concrete purpose.** This may happen by writing a custom abstract API layer wrapping the base UI components (View, Image, Pressable, etc.), and defining bindings for every prop as a convenience to consumers. On the local client, a binding set operation passes the entire key-value store to ReactVR. So the bigger this gets, the greater the CPU cost to perform a single binding set.

2. **Animations, by way of periodic binding updates, should be implemented with care or not at all.** This is due to the twofold nature of (a) bridge call frequency limits, and (b) network latency and droughts/bursts associated with that.

---

*Source: [Meta Horizon Worlds Developer Documentation](https://developers.meta.com/horizon-worlds/learn/documentation/performance-best-practices-and-tooling/performance-best-practices/custom-ui-optimization)*

*Saved on: August 28, 2025*
