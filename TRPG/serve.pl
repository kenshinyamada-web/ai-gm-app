#!/usr/bin/perl
use strict;
use IO::Socket::INET;
use MIME::Base64;

my $port = 3000;
my $root = $ENV{PWD} || '.';

my %mime = (
  html => 'text/html; charset=utf-8',
  css  => 'text/css',
  js   => 'application/javascript',
  json => 'application/json',
  png  => 'image/png',
  jpg  => 'image/jpeg',
  ico  => 'image/x-icon',
);

my $server = IO::Socket::INET->new(
  LocalPort => $port,
  Type      => SOCK_STREAM,
  Reuse     => 1,
  Listen    => 10,
) or die "Cannot bind port $port: $!\n";

print "Serving $root on http://localhost:$port/\n";
$| = 1;

while (my $client = $server->accept()) {
  my $req = '';
  while (my $line = <$client>) {
    $req .= $line;
    last if $line eq "\r\n" || $line eq "\n";
  }
  if ($req =~ /^GET\s+(\S+)\s+HTTP/) {
    my $path = $1;
    $path =~ s/\?.*//;
    $path = '/' if $path eq '';
    $path = '/ai_trpg_gm.html' if $path eq '/';
    $path =~ s/\.\.\///g;
    my $file = $root . $path;
    $file =~ s|/|\\|g if $^O eq 'MSWin32';
    if (-f $file) {
      my ($ext) = $file =~ /\.(\w+)$/;
      my $ct = $mime{lc($ext)||''} || 'application/octet-stream';
      open my $fh, '<:raw', $file or do {
        print $client "HTTP/1.0 403 Forbidden\r\n\r\n";
        close $client; next;
      };
      local $/; my $body = <$fh>; close $fh;
      print $client "HTTP/1.0 200 OK\r\nContent-Type: $ct\r\nContent-Length: " . length($body) . "\r\n\r\n$body";
    } else {
      print $client "HTTP/1.0 404 Not Found\r\nContent-Type: text/plain\r\n\r\n404 Not Found: $path\n";
    }
  }
  close $client;
}
