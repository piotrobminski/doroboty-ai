# Typography implementation and active target

New and changed UI follows **Technologia po ludzku**: [receiving guide](../../../docs/design-system/README.md), [source typography](../../../docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html#type) and [host adaptation](../../../docs/design-system/IMPLEMENTATION.md). Its heading/body roles use Arial/Helvetica/sans, with technical mono metadata. Do not add Geist Serif as a requirement for new screens.

The runtime now uses system font stacks only. The old Geist Serif and illustration remain in the immutable historical kit, with their original licenses, but are no longer imported by the application. No external font endpoint is used.
