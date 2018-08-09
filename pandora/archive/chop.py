import json
import os
import subprocess
from bisect import bisect_left

import ox

class Chop(object):
    keyframes = []
    subtitles = None
    info = {}
    ffmpeg = [
        'ffmpeg',
        '-nostats', '-loglevel', 'error',
        '-y',
    ]

    def __init__(self, source, output, start, end, subtitles=None):
        self.video = source
        self.subtitles = subtitles
        output_file, output_ext = os.path.splitext(output)
        sections = self.get_gop_sections(start, end)

        if output_ext == '.mp4':
            part_ext = '.ts'
        else:
            part_ext = output_ext
        start_part = output + '.start' + part_ext
        middle_part = output + '.middle' + part_ext
        end_part = output + '.end' + part_ext

        segments = []
        cmds = []

        # prepare subtitles
        if self.subtitles:
            self.subtitles_output = output_file + '.srt'
            cmd = self.ffmpeg + [
                '-i', self.subtitles,
                '-ss', '%f' % start, '-t', '%f' % (end-start),
                self.subtitles_output
            ]
            cmds.append(cmd)

        # re-encode up to keyframe
        if sections['start'][1] > sections['start'][0]:
            cmd = self.encode(source, start_part,
                              start=start,
                              duration=sections['start'][1] - start)
            cmds.append(cmd)
            segments.append(start_part)
        # cut out middle segment
        if sections['end'][1] - sections['start'][2] > 0:
            cmd = self.copy(source, middle_part,
                            start=sections['start'][2],
                            duration=sections['end'][1] - sections['start'][2])
            cmds.append(cmd)
            segments.append(middle_part)
        # re-encode after last keyframe
        if sections['end'][2] > sections['end'][1]:
            cmd = self.encode(source, end_part,
                              start=sections['end'][1],
                              duration=end - sections['end'][1])
            cmds.append(cmd)
            segments.append(end_part)

        if len(segments) > 1:
            cmd, files = self.join(segments, output)
            cmds.append(cmd)
            segments += files
        else:
            cmds.append(['cp', segments[0], output])

        for cmd in cmds:
            #print(' '.join(cmd))
            subprocess.call(cmd)
        for segment in segments:
            os.unlink(segment)

    def get_info(self):
        if self.info:
            return self.info
        self.info = ox.avinfo(self.video)
        return self.info

    def get_keyframes(self):
        video = self.video
        if self.keyframes:
            return self.keyframes

        keyframes_cache = video + '.keyframes'
        if os.path.exists(keyframes_cache):
            with open(keyframes_cache, 'r') as fd:
                self.keyframes = json.load(fd)
            return self.keyframes

        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_packets', '-select_streams', 'v',
            '-show_entries', 'packet=pts_time,flags',
            '-of', 'csv',
            '-i', video
        ]
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        stdout, stderr = p.communicate()
        result = stdout.decode().strip()
        keyframe_times = []
        timecode = 0
        for line in result.split('\n'):
            if line.split(',')[1] != 'N/A':
                timecode = line.split(',')[1]
            if ',K' in line:
                keyframe_times.append(float(timecode))

        last_keyframe = self.get_info()['duration']
        if keyframe_times[-1] != last_keyframe:
            keyframe_times.append(last_keyframe)

        self.keyframes = keyframe_times
        if not os.path.exists(keyframes_cache):
            with open(keyframes_cache, 'w') as fd:
                json.dump(keyframe_times, fd)
        return keyframe_times

    def get_gop_sections(self, start: float, end: float) -> dict:
        keyframes = self.get_keyframes()
        start_pos = bisect_left(keyframes, start)
        end_pos = bisect_left(keyframes, end)
        return {
            'start': (
                keyframes[start_pos - 1] if start_pos > 0 else keyframes[start_pos],
                keyframes[start_pos],
                keyframes[start_pos + 1]
            ),
            'end': (
                keyframes[end_pos - 2] if end_pos != (len(keyframes) - 1) else keyframes[end_pos - 1],
                keyframes[end_pos - 1] if end_pos != (len(keyframes) - 1) else keyframes[end_pos],
                keyframes[end_pos]
            )
        }

    def encode(self, source, target, start, duration):
        info = self.get_info()
        if self.info['audio']:
            acodec = [
                '-c:a',
                self.info['audio'][0]['codec']
            ]
        else:
            acodec = []
        vcodec = [
            '-c:v',
            self.info['video'][0]['codec']
        ]

        cmd = self.ffmpeg + [
            '-ss', '%f' % start,
            '-i', source,
            '-t', '%f' % duration,
            '-reset_timestamps', '1',
        ] + acodec + [
        ] + vcodec + [
            target
        ]
        return cmd

    def copy(self, source, target, start, duration):
        cmd = self.ffmpeg + [
            '-ss', '%f' % start,
            '-i', source,
            '-t', '%f' % duration,
            '-c:v', 'copy', '-c:a', 'copy',
            '-reset_timestamps', '1',
            target
        ]
        return cmd

    def join(self, segments, target):
        file_list = target + '.txt'
        with open(file_list, 'w') as fd:
            for segment in segments:
                fd.write('file %s\n' % segment)
        if self.subtitles:
            subtitles = [
                '-i', self.subtitles_output,
                '-c:s', 'mov_text'
            ]
        else:
            subtitles = []
        cmd = self.ffmpeg + [
            '-f', 'concat', '-safe', '0', '-i', file_list,
        ] + subtitles + [
            '-c:v', 'copy', '-c:a', 'copy',
            '-reset_timestamps', '1',
            target
        ]
        files = [file_list]
        if self.subtitles:
            files.append(self.subtitles_output)
        return cmd, files

