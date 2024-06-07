const std = @import("std");
const testing = std.testing;
const x11 = @cImport({
    @cInclude("X11/Xlib.h");
    @cInclude("X11/Xutil.h");
});

export fn add(a: i32, b: i32) i32 {
    return a + b;
}

test "basic add functionality" {
    try testing.expect(add(3, 7) == 10);
}

fn parseArgs() !(struct { u32, u32 }) {
    const args = try std.process.argsAlloc(std.heap.page_allocator);
    defer std.heap.page_allocator.free(args);

    if (args.len != 3) {
        std.debug.print("Usage: {s} <rows> <columns>\n", .{args[0]});
        return error.InvalidArgument;
    }

    const rows = try std.fmt.parseInt(u32, args[1], 10);
    const columns = try std.fmt.parseInt(u32, args[2], 10);

    return .{ rows, columns };
}

fn renderResults(display: *x11.Display, window: x11.Window, gc: x11.GC, rows: u32, columns: u32) void {
    // Static list of results to display (for demonstration purposes).
    const results = [_][]const u8{ "result1", "result2", "result3", "result4", "result5", "result6" };
    const row_height = 20; // Height of each row.
    const column_width = 100; // Width of each column.

    var result_index: usize = 0;
    // Loop to draw each result string in a grid.
    for (rows) |row| {
        for (columns) |col| {
            if (result_index >= results.len) break; // Break if there are no more results to display.
            const text = results[result_index];
            x11.XDrawString(display, window, gc, c_int(col * column_width + 10), c_int(row * row_height + 20), text.ptr, c_int(text.len));
            result_index += 1;
        }
    }
}

pub fn main() !void {
    const rows, const columns = try parseArgs();

    const display = x11.XOpenDisplay(null);
    if (display == null) {
        std.debug.print("Cannot open display\n", .{});
        return;
    }

    const screen = x11.XDefaultScreen(display);
    const window = x11.XCreateSimpleWindow(display, x11.XRootWindow(display, screen), 10, 10, c_uint(columns * 100), c_uint(rows * 20), 1, x11.XBlackPixel(display, screen), x11.XWhitePixel(display, screen));

    x11.XSelectInput(display, window, x11.ExposureMask | x11.KeyPressMask);
    x11.XMapWindow(display, window);

    const gc = x11.XCreateGC(display, window, 0, null);

    while (true) {
        var event: x11.XEvent = undefined;
        x11.XNextEvent(display, &event);

        switch (event.type) {
            x11.Expose => {
                renderResults(display, window, gc, rows, columns);
            },
            x11.KeyPress => {
                break;
            },
            else => {},
        }
    }

    x11.XFreeGC(display, gc);
    x11.XDestroyWindow(display, window);
    x11.XCloseDisplay(display);
}
